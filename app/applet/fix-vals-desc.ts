import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const vals = await prisma.valoresIndividuais.findMany({
    where: { 
      descricao: { startsWith: 'Juros/Resíduo de Atraso' }
    }
  });

  for (const v of vals) {
    // If it's already updated, skip
    if (v.descricao.includes('Pgto em')) continue;

    const dataPagamentoFicticia = '10/04/2026';
    await prisma.valoresIndividuais.update({
      where: { id: v.id },
      data: {
        descricao: `Juros/Resíduo de Atraso (Pgto em ${dataPagamentoFicticia})`
      }
    });
    console.log(`Updated ${v.id} description to include Pgto em ${dataPagamentoFicticia}`);
  }
}
main().catch(console.error).finally(()=> prisma.$disconnect());
