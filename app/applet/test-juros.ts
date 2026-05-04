import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const faturas = await prisma.fatura.findMany({
    where: { mes_ano: '2026-03' },
    include: { proprietario: true },
    orderBy: { proprietario: { apartamento: 'asc' } }
  });
  const f203 = faturas.find(f => f.proprietario.apartamento === '203');
  console.log("Apto 203:", f203);
  if(f203) {
    const p = await prisma.parametros.findFirst({ orderBy: { mes_ano: 'desc' }});
    console.log("Params:", p);
    console.log("Calculated 27 days 3%:", f203.valor_total * (3/100/30) * 27);
  }
}
main().catch(console.error).finally(()=> prisma.$disconnect());
