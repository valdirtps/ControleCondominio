import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const params = await prisma.parametros.findFirst({ orderBy: { mes_ano: 'desc' }});
  if (!params) return;
  
  const faturas = await prisma.fatura.findMany({
    where: { status: 'PAGO' },
    include: { proprietario: true },
  });

  for (const f of faturas) {
    if (f.multa > 0 && f.dias_atraso > 0) {
       const pr = params.multa_percentual;
       const prorata = f.valor_total * (pr / 100 / 30) * f.dias_atraso;
       
       console.log(`Fatura apto ${f.proprietario.apartamento} mes ${f.mes_ano}: Multa velha ${f.multa}, nova prorata ${prorata}`);
       
       const diferencaAntiga = (f.valor_total + f.multa) - (f.valor_pago || 0);
       const diferencaNova = (f.valor_total + prorata) - (f.valor_pago || 0);
       
       await prisma.fatura.update({
         where: { id: f.id },
         data: {
           multa: 0,
           juros: prorata
         }
       });

       if (diferencaAntiga > 0) {
           await prisma.proprietario.update({
             where: { id: f.proprietarioId },
             data: {
               saldo_devedor_inicial: { decrement: diferencaAntiga }
             }
           });
       }

       if (diferencaNova > 0.01) {
           // We will create the residual because previously I didn't create it in my prior version (the proprietario balance was updated directly instead)
           // If they paid before my fix, they updated proprietario.saldo_devedor_inicial directly.
           // I rolled the diferencaAntiga back. Now I add the diferencaNova correctly to saldo_devedor_inicial.
           await prisma.proprietario.update({
             where: { id: f.proprietarioId },
             data: {
               saldo_devedor_inicial: { increment: diferencaNova }
             }
           });
       }
    }
  }
}
main().catch(console.error).finally(()=> prisma.$disconnect());
