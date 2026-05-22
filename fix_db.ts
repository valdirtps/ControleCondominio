import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const faturas = await prisma.fatura.findMany({ take: 1 });
  console.log("Fatura detalhes:", faturas[0].detalhes);
}
main().catch(console.error).finally(() => prisma.$disconnect());
