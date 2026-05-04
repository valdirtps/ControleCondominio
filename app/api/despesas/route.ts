import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const data = await request.json();
    
    if (!data.tipo || !data.referente || !data.valor || !data.data_pagamento) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const despesa = await prisma.despesa.create({
      data: {
        tipo: data.tipo,
        valor: data.valor,
        referente: data.referente,
        observacao: data.observacao || null,
        data_pagamento: new Date(data.data_pagamento),
        condominioId: session.user.condominioId,
      },
    });

    return NextResponse.json(despesa);
  } catch (error) {
    console.error('Error creating despesa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
