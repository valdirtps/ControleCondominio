import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const faturas = await prisma.fatura.findMany();
  console.log("Faturas:", faturas.length);
  if (faturas.length > 0) {
    console.log("Fatura detalhe:", faturas[0].createdAt, faturas[0].detalhes);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
