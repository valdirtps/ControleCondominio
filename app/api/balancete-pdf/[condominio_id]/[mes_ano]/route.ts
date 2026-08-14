import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateBalancetePDFBuffer } from '@/lib/balancete-pdf';

export async function GET(req: Request, { params }: { params: Promise<{ condominio_id: string; mes_ano: string }> }) {
  try {
    const { condominio_id, mes_ano } = await params;
    const mesAno = mes_ano;

    const condominio = await prisma.condominio.findUnique({
      where: { id: condominio_id },
      include: {
        despesas: true,
        creditosExtras: true,
        chamadasExtras: true,
        faturas: {
          include: { proprietario: true }
        },
        parametros: { orderBy: { mes_ano: 'desc' } }
      }
    });

    if (!condominio) {
      return new NextResponse('Condomínio não encontrado', { status: 404 });
    }

    const [year, month] = mesAno.split('-');

    const getVencimentoForCycle = (referente: string | null, data_pagamento: Date) => {
      let dataCalc = data_pagamento || new Date();
      if (referente && referente.match(/^\d{4}-\d{2}$/)) {
        const [y, m] = referente.split('-').map(Number);
        dataCalc = new Date(Date.UTC(y, m - 1, 15, 12, 0, 0));
      }
      let nextMonth = dataCalc.getUTCMonth(); 
      let nextYear = dataCalc.getUTCFullYear();
      const mesAnoStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`;
      const param = condominio.parametros.find(p => p.mes_ano <= mesAnoStr) || condominio.parametros[0];
      const diaVencimento = param ? param.dia_vencimento : 10;
      return new Date(Date.UTC(nextYear, nextMonth, diaVencimento, 12, 0, 0));
    };

    const allTransactions = [
      ...condominio.despesas.map(d => ({
        type: 'despesa',
        data: getVencimentoForCycle(d.referente, d.data_pagamento as Date),
        entrada: 0,
        saida: d.valor,
        desc: d.tipo,
        raw: d
      })),
      ...condominio.creditosExtras.map(c => ({
        type: 'credito',
        data: c.data_vencimento || getVencimentoForCycle(c.mes_ano || c.referente, (c.data_pagamento || c.data_lancamento) as Date),
        entrada: c.valor,
        saida: 0,
        desc: c.referente,
        raw: c
      })),
      ...condominio.faturas.filter(f => f.status === 'PAGO' || f.status === 'PARCIAL').map(f => ({
        type: 'fatura',
        data: f.data_vencimento,
        entrada: f.valor_pago || f.valor_total,
        saida: 0,
        desc: `Apto ${f.proprietario?.apartamento || ''}`,
        raw: f
      })),
    ].sort((a, b) => a.data.getTime() - b.data.getTime());

    let saldoInicial = condominio.saldo_inicial;
    let saldoAnterior = saldoInicial;
    let totalEntradas = 0;
    let totalSaidas = 0;

    const currentMonthTransactions: any[] = [];
    
    for (const t of allTransactions) {
      const tYear = t.data.getUTCFullYear();
      const tMonth = t.data.getUTCMonth() + 1;
      const tMesAno = `${tYear}-${String(tMonth).padStart(2, '0')}`;
      if (tMesAno < mesAno) {
        saldoAnterior += t.entrada - t.saida;
      } else if (tMesAno === mesAno) {
        currentMonthTransactions.push(t);
        totalEntradas += t.entrada;
        totalSaidas += t.saida;
      }
    }

    const saldoFinal = saldoAnterior + totalEntradas - totalSaidas;
    const despesasDoMes = currentMonthTransactions.filter(t => t.type === 'despesa');
    const faturasPagas = currentMonthTransactions.filter(t => t.type === 'fatura');
    const creditosExtras = currentMonthTransactions.filter(t => t.type === 'credito');

    const faturasEmAtraso = condominio.faturas.filter(f => {
      if (f.status === 'PENDENTE' || f.status === 'ATRASADO') {
        const fYear = f.data_vencimento.getUTCFullYear();
        const fMonth = f.data_vencimento.getUTCMonth() + 1;
        const fMesAno = `${fYear}-${String(fMonth).padStart(2, '0')}`;
        return fMesAno === mesAno || fMesAno < mesAno;
      }
      return false;
    });

    const activeChamadasExtras: any[] = []; // simplified for now

    const pdfBuffer = await generateBalancetePDFBuffer(
      condominio,
      mesAno,
      { saldoAnterior, totalEntradas, totalSaidas, saldoFinal },
      faturasPagas,
      creditosExtras,
      despesasDoMes,
      faturasEmAtraso,
      activeChamadasExtras
    );

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Balancete_${condominio.nome.replace(/\s+/g, '_')}_${month}_${year}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF do balancete:', error);
    return new NextResponse('Erro interno ao gerar PDF', { status: 500 });
  }
}
