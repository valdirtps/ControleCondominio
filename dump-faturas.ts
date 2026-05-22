import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const faturas = await prisma.fatura.findMany({
    where: { mes_ano: '2026-04', proprietarioId: 'cmnp9sxvt000hs6fcokz97a01' },
    include: { proprietario: true },
  });
  console.log("Faturas 2026-04 Apto 203:");
  console.log(faturas.map(f => ({ id: f.id, total: f.valor_total, status: f.status, detalhes: f.detalhes })));
}
main().catch(console.error).finally(()=> prisma.$disconnect());
