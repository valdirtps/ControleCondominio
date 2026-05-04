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

    // Check if trying to edit locked month
    const existingParams = await prisma.parametros.findMany({
      where: { condominioId: session.user.condominioId },
      orderBy: { mes_ano: 'desc' }
    });
    
    // Simplistic check, same as other places. A month is locked if Faturas are generated
    const faturasCount = await prisma.fatura.count({
      where: { condominioId: session.user.condominioId, mes_ano }
    });
    
    if (faturasCount > 0) {
      return NextResponse.json({ error: 'Este mês já possui faturas geradas e está bloqueado para novos lançamentos.' }, { status: 400 });
    }

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
