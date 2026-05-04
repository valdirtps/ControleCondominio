import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateFaturaPDFBuffer } from '@/lib/fatura-pdf';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const faturaId = resolvedParams.id;

    const fatura = await prisma.fatura.findUnique({
      where: { id: faturaId },
      include: {
        proprietario: true,
        condominio: {
          include: {
            sindicos: { where: { ativo: true }, include: { proprietario: true } }
          }
        }
      },
    });

    if (!fatura || fatura.condominioId !== session.user.condominioId) {
      return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });
    }

    if (!fatura.proprietario.email) {
      return NextResponse.json({ error: 'Proprietário sem e-mail cadastrado' }, { status: 400 });
    }

    // Configure Nodemailer
    const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (!hasSmtpConfig) {
      console.log(`[SIMULAÇÃO] E-mail que seria enviado para ${fatura.proprietario.email} referente à fatura ${fatura.mes_ano}`);
      return NextResponse.json({ 
        message: `[MODO SIMULADO] Faltam segredos. Configuração detectada: HOST(${Boolean(process.env.SMTP_HOST)}), USER(${Boolean(process.env.SMTP_USER)}), PASS(${Boolean(process.env.SMTP_PASS)})`,
        isSimulado: true
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    try {
      // Generate the PDF Buffer
      const pdfBuffer = await generateFaturaPDFBuffer(fatura);

      const info = await transporter.sendMail({
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
      console.log('Mensagem enviada com sucesso:', info.messageId);
    } catch (smtpError: any) {
      console.error('Erro específico do SMTP ou PDF:', smtpError);
      return NextResponse.json({ 
        error: `Falha na geração/envio: ${smtpError.message || smtpError.code || 'Erro desconhecido'}` 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Fatura em anexo e-mail enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao processar envio:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o envio' }, { status: 500 });
  }
}
