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

    const activeSindico = await prisma.sindico.findFirst({
      where: { condominioId: session.user.condominioId!, ativo: true }
    });

    if (existingDespesa.sindicoId && activeSindico && existingDespesa.sindicoId !== activeSindico.id) {
      const providedCode = request.headers.get("x-verification-code") || data.codigo_verificacao;
      const creatorSindico = await prisma.sindico.findUnique({
        where: { id: existingDespesa.sindicoId },
        include: { proprietario: true }
      });

      if (!creatorSindico || !creatorSindico.codigo_verificacao || creatorSindico.codigo_verificacao !== providedCode) {
        return NextResponse.json({
          error: "Código de verificação incorreto ou não fornecido",
          codeRequired: true,
          creatorSindicoId: existingDespesa.sindicoId,
          creatorSindicoEmail: creatorSindico?.email_pessoal || creatorSindico?.proprietario?.email || "sindico@exemplo.com",
          creatorSindicoNome: creatorSindico ? (creatorSindico.empresa_nome || creatorSindico.proprietario?.nome || "Síndico Anterior") : "Síndico Anterior"
        }, { status: 403 });
      }
    }

    const despesa = await prisma.despesa.update({
      where: { id },
      data: {
        tipo,
        valor: Number(valor),
        referente,
        observacao: observacao || null,
        data_pagamento: new Date(data_pagamento),
        sindicoId: activeSindico?.id || undefined,
      },
    });

    return NextResponse.json(despesa);
  } catch (error: any) {
    console.error('Erro ao atualizar despesa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message || String(error) }, { status: 500 });
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

    const activeSindico = await prisma.sindico.findFirst({
      where: { condominioId: session.user.condominioId!, ativo: true }
    });

    if (existingDespesa.sindicoId && activeSindico && existingDespesa.sindicoId !== activeSindico.id) {
      const urlObj = new URL(request.url);
      const providedCode = request.headers.get("x-verification-code") || urlObj.searchParams.get("codigo_verificacao");
      const creatorSindico = await prisma.sindico.findUnique({
        where: { id: existingDespesa.sindicoId },
        include: { proprietario: true }
      });

      if (!creatorSindico || !creatorSindico.codigo_verificacao || creatorSindico.codigo_verificacao !== providedCode) {
        return NextResponse.json({
          error: "Código de verificação incorreto ou não fornecido",
          codeRequired: true,
          creatorSindicoId: existingDespesa.sindicoId,
          creatorSindicoEmail: creatorSindico?.email_pessoal || creatorSindico?.proprietario?.email || "sindico@exemplo.com",
          creatorSindicoNome: creatorSindico ? (creatorSindico.empresa_nome || creatorSindico.proprietario?.nome || "Síndico Anterior") : "Síndico Anterior"
        }, { status: 403 });
      }
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
