import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { proprietarioId, mes_ano, valor, descricao } = data;

    if (!proprietarioId || !mes_ano || valor === undefined || !descricao) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // The check for already generated faturas was removed to allow late entries
    // that can trigger a fatura recalculation later.
    
    const valorInd = await prisma.valoresIndividuais.create({
      data: {
        proprietarioId,
        mes_ano,
        valor: Number(valor),
        descricao,
        condominioId: session.user.condominioId,
      }
    });

    return NextResponse.json(valorInd);
  } catch (error) {
    console.error('Failed to create valor individual:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
