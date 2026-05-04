import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateFaturaPDFBuffer } from '@/lib/fatura-pdf';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { mes_ano } = await req.json();
    if (!mes_ano) {
      return NextResponse.json({ error: 'Mês/Ano não informado' }, { status: 400 });
    }

    // Busca todas as faturas do condomínio daquele mês específico cujo proprietário tem email
    const faturas = await prisma.fatura.findMany({
      where: { 
        condominioId: session.user.condominioId,
        mes_ano: mes_ano,
        proprietario: {
          email: { not: null, notIn: [''] }
        }
      },
      include: {
        proprietario: true,
        condominio: {
          include: {
            sindicos: { where: { ativo: true }, include: { proprietario: true } }
          }
        }
      },
    });

    if (faturas.length === 0) {
      return NextResponse.json({ error: 'Nenhum proprietário com e-mail cadastrado foi encontrado para as faturas deste mês.' }, { status: 404 });
    }

    const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    let transporter: nodemailer.Transporter | null = null;

    if (hasSmtpConfig) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: { rejectUnauthorized: false }
      });
    }

    let sentCount = 0;

    for (const fatura of faturas) {
      if (!hasSmtpConfig) {
        console.log(`[SIMULAÇÃO EM LOTE] E-mail que seria enviado para ${fatura.proprietario.email} referente à fatura ${fatura.mes_ano}`);
        sentCount++;
        continue;
      }

      try {
        if (transporter && fatura.proprietario.email) {
          const pdfBuffer = await generateFaturaPDFBuffer(fatura);

          await transporter.sendMail({
            from: `"${fatura.condominio.nome}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: fatura.proprietario.email,
            subject: `Fatura de Condomínio - ${fatura.mes_ano}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h2>Olá, ${fatura.proprietario.nome}</h2>
                <p>A fatura do condomínio <strong>${fatura.condominio.nome}</strong> referente ao mês <strong>${fatura.mes_ano}</strong> já está disponível.</p>
                
                <p><strong>Apartamento:</strong> ${fatura.proprietario.apartamento}</p>
                <p><strong>Valor Total:</strong> R$ ${fatura.valor_total.toFixed(2).replace('.', ',')}</p>
                <p><strong>Vencimento:</strong> ${new Date(new Date(fatura.data_vencimento).getTime() + new Date().getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')}</p>
                
                <p>Segue em anexo o arquivo PDF com os detalhes completos da sua fatura e a linha digitável (comprovante).</p>
                
                <p><small>Se você já realizou o pagamento, por favor, desconsidere este e-mail.</small></p>
              </div>
            `,
            attachments: [
              {
                filename: `Fatura_${fatura.mes_ano}_Apto_${fatura.proprietario.apartamento}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              }
            ]
          });
          sentCount++;
        }
      } catch (e) {
        console.error(`Erro ao gerar/enviar para ${fatura.proprietario.email}:`, e);
      }
    }

    if (!hasSmtpConfig) {
      return NextResponse.json({ 
        message: `Envio concluído: ${sentCount} e-mails simulados com sucesso! (Você precisa configurar o SMTP para envios reais).` 
      });
    }

    return NextResponse.json({ message: `Lote processado! ${sentCount} e-mails (com PDF anexo) foram enviados com sucesso.` });
  } catch (error) {
    console.error('Erro ao enviar e-mail em lote:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o envio em lote' }, { status: 500 });
  }
}
