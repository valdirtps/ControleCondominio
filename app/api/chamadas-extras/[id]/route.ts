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
    const { mes_ano, referente, valor_total, parcelas, valor } = await req.json();

    const chamadaExtra = await prisma.chamadaExtra.update({
      where: { id },
      data: {
        mes_ano,
        referente,
        valor_total,
        parcelas,
        valor,
      },
    });

    return NextResponse.json(chamadaExtra);
  } catch (error) {
    console.error('Erro ao atualizar chamada extra:', error);
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

    await prisma.chamadaExtra.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir chamada extra:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
