import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.fatura.deleteMany({
    where: { mes_ano: '2026-04' }
  });
  console.log("Deleted 2026-04 faturas to force user to regenerate and see the new text");
}
main().catch(console.error).finally(()=> prisma.$disconnect());
