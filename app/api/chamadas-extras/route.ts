import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { mes_ano, referente, valor_total, parcelas, valor } = await req.json();

    const chamadaExtra = await prisma.chamadaExtra.create({
      data: {
        mes_ano,
        referente,
        valor_total,
        parcelas,
        valor,
        condominioId: session.user.condominioId!,
      },
    });

    return NextResponse.json(chamadaExtra);
  } catch (error) {
    console.error('Erro ao adicionar chamada extra:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
