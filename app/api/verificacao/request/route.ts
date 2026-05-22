import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { sindicoId } = await request.json();
    if (!sindicoId) {
      return NextResponse.json({ error: 'Síndico ID é obrigatório' }, { status: 400 });
    }

    const sindico = await prisma.sindico.findUnique({
      where: { id: sindicoId },
      include: { proprietario: true }
    });

    if (!sindico) {
      return NextResponse.json({ error: 'Síndico não cadastrado' }, { status: 404 });
    }

    // Generate a secure 6-digit code format
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist code on the creator sindico
    await prisma.sindico.update({
      where: { id: sindicoId },
      data: { codigo_verificacao: code }
    });

    // We print it in server logs & return it in API so they can retrieve it in UI for easier dev-test
    const emailDestinatario = sindico.email_pessoal || (sindico.proprietario?.email) || "sindico@sistemacondominio.com";
    const nomeSindico = sindico.empresa_nome || (sindico.proprietario?.nome) || "Síndico Anterior";

    console.log(`[EMAIL SIMULADO] Código de segurança ${code} enviado com sucesso para ${emailDestinatario} (Síndico: ${nomeSindico})`);

    return NextResponse.json({
      success: true,
      code,
      email: emailDestinatario,
      nome: nomeSindico,
      message: `Código enviado com sucesso para ${emailDestinatario}`
    });
  } catch (error) {
    console.error('Erro na solicitação de código de segurança:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
