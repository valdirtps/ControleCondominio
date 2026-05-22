import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const chamadas = await prisma.chamadaExtra.findMany();
  console.log("Chamadas:", chamadas);
}
main().catch(console.error).finally(() => prisma.$disconnect());
