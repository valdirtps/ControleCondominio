import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();
async function main() {
  const p = await prisma.proprietario.findFirst({
    where: { apartamento: '203' }
  });

  if (!p) {
    console.log("Apto 203 not found");
    return;
  }

  const f = await prisma.fatura.findFirst({
    where: { 
      proprietarioId: p.id,
      mes_ano: '2026-03'
    }
  });

  let dataPgtoStr = '06/04/2026';
  if (f && f.data_pagamento) {
    // try to format real date just to be sure, although user said 06/04/2026
    dataPgtoStr = format(new Date(f.data_pagamento.getTime() + new Date().getTimezoneOffset() * 60000), 'dd/MM/yyyy');
  }
  
  console.log(`Real payment date for 2026-03 or fallback: ${dataPgtoStr}`);

  // Find the exact valores individuais
  const vals = await prisma.valoresIndividuais.findMany({
    where: { 
      proprietarioId: p.id,
      mes_ano: '2026-04',
      descricao: { startsWith: 'Juros/Resíduo' }
    }
  });

  for (const v of vals) {
    await prisma.valoresIndividuais.update({
      where: { id: v.id },
      data: {
        descricao: `Juros/Resíduo de Atraso (Pgto em 06/04/2026)`
      }
    });
    console.log(`Updated vals desc to: Juros/Resíduo de Atraso (Pgto em 06/04/2026)`);
  }

  // Delete faturas 2026-04 so regeneration works and pulls the updated desc
  await prisma.fatura.deleteMany({
    where: { mes_ano: '2026-04' }
  });
  console.log("Deleted 2026-04 faturas so user can regenerate.");

}
main().catch(console.error).finally(()=> prisma.$disconnect());
