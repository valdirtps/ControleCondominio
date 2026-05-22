import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.despesa.deleteMany({
    where: {
      referente: {
        in: ['Produtos para o hall e corredores', 'Conserto do portão']
      }
    }
  });
  console.log("Deleted test despesas.");

  await prisma.fatura.deleteMany({
    where: { mes_ano: '2026-04' }
  });
  console.log("Deleted pending faturas 2026-04.");
}
main().catch(console.error).finally(()=> prisma.$disconnect());
