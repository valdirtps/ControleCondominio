import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { proprietarioId, valor, descricao, mes_ano } = body;

    const valorInd = await prisma.valoresIndividuais.update({
      where: { id, condominioId: session.user.condominioId },
      data: {
        proprietarioId,
        valor: parseFloat(valor),
        descricao,
        mes_ano,
      }
    });

    return NextResponse.json({ success: true, data: valorInd });
  } catch (error) {
    console.error('Failed to update valor individual:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const valorInd = await prisma.valoresIndividuais.findUnique({
      where: { id, condominioId: session.user.condominioId }
    });

    if (!valorInd) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const faturasCount = await prisma.fatura.count({
      where: { condominioId: session.user.condominioId, mes_ano: valorInd.mes_ano }
    });
    
    if (faturasCount > 0) {
      return NextResponse.json({ error: 'Este mês já possui faturas geradas e está bloqueado para exclusão de lançamentos.' }, { status: 400 });
    }

    await prisma.valoresIndividuais.delete({
      where: { id, condominioId: session.user.condominioId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete valor individual:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
