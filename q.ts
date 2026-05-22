import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const fx = await prisma.fatura.findMany();
  console.log("faturas count", fx.length);
  for (const f of fx) {
    console.log(f.mes_ano, f.status, f.data_vencimento, f.data_pagamento, f.valor_pago, f.valor_total);
  }
  await prisma.$disconnect();
}
run();
