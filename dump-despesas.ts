import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const d = await prisma.despesa.findMany({
    orderBy: { data_pagamento: 'desc' }
  });
  console.log(d.slice(0, 5));
}
main().catch(console.error).finally(()=> prisma.$disconnect());
