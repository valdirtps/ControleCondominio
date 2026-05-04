import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const data = await request.json();
    
    if (!data.mes_ano) {
      return NextResponse.json({ error: 'Mês/Ano é obrigatório' }, { status: 400 });
    }

    const valores = await prisma.valoresMensais.upsert({
      where: {
        mes_ano_condominioId: {
          mes_ano: data.mes_ano,
          condominioId: session.user.condominioId,
        }
      },
      update: {
        valor_agua: data.valor_agua,
        valor_luz: data.valor_luz,
        fundo_reserva: data.fundo_reserva,
        taxa_condominio: data.taxa_condominio,
        observacao: data.observacao,
      },
      create: {
        mes_ano: data.mes_ano,
        valor_agua: data.valor_agua,
        valor_luz: data.valor_luz,
        fundo_reserva: data.fundo_reserva,
        taxa_condominio: data.taxa_condominio,
        observacao: data.observacao,
        condominioId: session.user.condominioId,
      },
    });

    return NextResponse.json(valores);
  } catch (error) {
    console.error('Error creating valores mensais:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
