import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const data = await request.json();
    
    if (!data.nome || !data.apartamento) {
      return NextResponse.json({ error: 'Nome e apartamento são obrigatórios' }, { status: 400 });
    }

    const existingProprietario = await prisma.proprietario.findFirst({
      where: {
        condominioId: session.user.condominioId,
        apartamento: data.apartamento,
      },
    });

    if (existingProprietario) {
      return NextResponse.json({ error: 'Já existe um proprietário para este apartamento' }, { status: 400 });
    }

    const proprietario = await prisma.proprietario.create({
      data: {
        nome: data.nome,
        apartamento: data.apartamento,
        telefone: data.telefone,
        email: data.email,
        saldo_devedor_inicial: data.saldo_devedor_inicial || 0,
        condominioId: session.user.condominioId,
      },
    });

    return NextResponse.json(proprietario);
  } catch (error) {
    console.error('Error creating proprietario:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
