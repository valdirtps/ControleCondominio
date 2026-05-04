const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const proprietarios = await prisma.proprietario.findMany();
  console.log("Proprietarios:", proprietarios.length);
  const sindico = await prisma.sindico.findFirst();
  console.log("Sindico:", sindico);
}

main().catch(console.error).finally(() => prisma.$disconnect());
