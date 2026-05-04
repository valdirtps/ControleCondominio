import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { LancamentosClient } from './lancamentos-client';

export default async function LancamentosPage() {
  const session = await getSession();
  if (!session) return null;

  const despesas = await prisma.despesa.findMany({
    where: { condominioId: session.user.condominioId },
    orderBy: { data_pagamento: 'desc' },
  });

  const valoresMensais = await prisma.valoresMensais.findMany({
    where: { condominioId: session.user.condominioId },
    orderBy: { mes_ano: 'desc' },
  });

  const chamadasExtras = await prisma.chamadaExtra.findMany({
    where: { condominioId: session.user.condominioId },
  });

  const parametros = await prisma.parametros.findMany({
    where: { condominioId: session.user.condominioId },
    orderBy: { mes_ano: 'desc' },
  });

  const sindico = await prisma.sindico.findFirst({
    where: { condominioId: session.user.condominioId, ativo: true },
  });

  const proprietarios = await prisma.proprietario.findMany({
    where: { condominioId: session.user.condominioId },
  });

  const rawValoresIndividuais = await prisma.valoresIndividuais.findMany({
    where: { condominioId: session.user.condominioId },
    include: { proprietario: true },
    orderBy: { createdAt: 'desc' },
  });

  const valoresIndividuais = rawValoresIndividuais.filter(
    (v: any) => !v.descricao.toLowerCase().includes('atraso (pgto em')
  );

  const creditosExtras = await prisma.creditoExtra.findMany({
    where: { condominioId: session.user.condominioId },
    orderBy: { mes_ano: 'desc' },
  });

  return <LancamentosClient 
    despesas={despesas} 
    valoresMensais={valoresMensais} 
    chamadasExtras={chamadasExtras}
    valoresIndividuais={valoresIndividuais}
    creditosExtras={creditosExtras}
    parametros={parametros}
    sindico={sindico}
    proprietarios={proprietarios}
  />;
}
