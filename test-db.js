const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const parametros = await prisma.parametros.findMany();
  console.log("Parametros:", parametros);
  
  const valoresMensais = await prisma.valoresMensais.findMany();
  console.log("Valores Mensais:", valoresMensais);
}

main().catch(console.error).finally(() => prisma.$disconnect());
