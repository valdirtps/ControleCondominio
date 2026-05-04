import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { valor, referente, mes_ano, data_lancamento } = await req.json();

    const credito = await prisma.creditoExtra.update({
      where: { id },
      data: {
        valor,
        referente,
        mes_ano,
        data_lancamento: data_lancamento ? new Date(data_lancamento) : undefined,
      },
    });

    return NextResponse.json(credito);
  } catch (error) {
    console.error('Erro ao atualizar crédito extra:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.creditoExtra.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir crédito extra:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
