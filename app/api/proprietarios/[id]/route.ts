import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const data = await request.json();

    if (!data.nome || !data.apartamento) {
      return NextResponse.json(
        { error: "Nome e apartamento são obrigatórios" },
        { status: 400 },
      );
    }

    const existingProprietario = await prisma.proprietario.findFirst({
      where: {
        condominioId: session.user.condominioId,
        apartamento: data.apartamento,
        id: { not: id },
        ativo: true,
      },
    });

    if (existingProprietario) {
      return NextResponse.json(
        { error: "Já existe um proprietário ativo para este apartamento" },
        { status: 400 },
      );
    }

    let proprietario;
    if (data.mudancaProprietario) {
      // 1. Deactive the old record as is (freezing history)
      await prisma.proprietario.update({
        where: { id, condominioId: session.user.condominioId },
        data: { ativo: false },
      });

      // 2. Create the new record with the new resident data for future bills
      proprietario = await prisma.proprietario.create({
        data: {
          nome: data.nome,
          apartamento: data.apartamento,
          telefone: data.telefone,
          email: data.email,
          saldo_devedor_inicial: data.saldo_devedor_inicial || 0,
          ativo: true,
          condominioId: session.user.condominioId,
        },
      });
    } else {
      proprietario = await prisma.proprietario.update({
        where: { id, condominioId: session.user.condominioId },
        data: {
          nome: data.nome,
          apartamento: data.apartamento,
          telefone: data.telefone,
          email: data.email,
          saldo_devedor_inicial: data.saldo_devedor_inicial || 0,
        },
      });
    }

    return NextResponse.json(proprietario);
  } catch (error) {
    console.error("Error updating proprietario:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await prisma.proprietario.delete({
      where: { id, condominioId: session.user.condominioId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting proprietario:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
