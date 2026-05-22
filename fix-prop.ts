import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.proprietario.findUnique({
    where: { id: 'cmnp9sxvt000hs6fcokz97a01' }
  });
  console.log("Prop:", p);

  // let's convert his saldo_devedor_inicial back into a valores_individuais!
  if (p && p.saldo_devedor_inicial > 0) {
     await prisma.valoresIndividuais.create({
       data: {
         mes_ano: '2026-04',
         valor: p.saldo_devedor_inicial,
         descricao: 'Juros/Resíduo de Atraso (Fatura 2026-03)',
         proprietarioId: p.id,
         condominioId: p.condominioId
       }
     });

     await prisma.proprietario.update({
       where: { id: p.id },
       data: { saldo_devedor_inicial: 0 }
     });
     console.log("Migrated saldo_devedor to valores_individuais!");
  }
}
main().catch(console.error).finally(()=> prisma.$disconnect());
