import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.condominio.findFirst();
  if(!c) return;

  await prisma.despesa.create({
    data: {
      tipo: 'Material de Limpeza',
      valor: 154.50,
      referente: 'Produtos para o hall e corredores',
      data_pagamento: new Date('2026-03-15T10:00:00Z'),
      condominioId: c.id
    }
  });

  await prisma.despesa.create({
    data: {
      tipo: 'Manutenção',
      valor: 400.00,
      referente: 'Conserto do portão',
      data_pagamento: new Date('2026-03-25T14:00:00Z'),
      condominioId: c.id
    }
  });
  console.log("Despesas adicionadas com sucesso");
}
main().catch(console.error).finally(()=> prisma.$disconnect());
