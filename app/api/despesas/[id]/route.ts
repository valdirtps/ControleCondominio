import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    const { tipo, valor, referente, observacao, data_pagamento } = data;

    if (!tipo || !valor || !referente || !data_pagamento) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
    }

    // Verify if the user has access to this despesa
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id },
      include: { condominio: true }
    });

    if (!existingDespesa) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    if (session.user.role !== 'ADMIN_SISTEMA' && existingDespesa.condominioId !== session.user.condominioId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const despesa = await prisma.despesa.update({
      where: { id },
      data: {
        tipo,
        valor: parseFloat(valor),
        referente,
        observacao: observacao || null,
        data_pagamento: new Date(data_pagamento),
      },
    });

    return NextResponse.json(despesa);
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify if the user has access to this despesa
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id },
      include: { condominio: true }
    });

    if (!existingDespesa) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    if (session.user.role !== 'ADMIN_SISTEMA' && existingDespesa.condominioId !== session.user.condominioId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await prisma.despesa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir despesa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
