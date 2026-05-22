import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const vals = await prisma.valoresIndividuais.findMany({});
  console.log("Valores individuais:", vals);
}
main().catch(console.error).finally(()=> prisma.$disconnect());
