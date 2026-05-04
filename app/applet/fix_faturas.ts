import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.fatura.deleteMany({
    where: { mes_ano: '2026-04' }
  });
  console.log("Deleted:", result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
