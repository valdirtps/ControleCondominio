import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';

import { BalanceteGenerator } from './balancete-generator';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const { user } = session;

  if (!user.condominioId) {
    if (user.role === 'ADMIN_SISTEMA') {
      redirect('/dashboard/condominios');
    }
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {user.nome}</h1>
        <p>Você não possui um condomínio vinculado.</p>
      </div>
    );
  }

  const condominio = await prisma.condominio.findUnique({
    where: { id: user.condominioId },
    include: {
      despesas: true,
      creditosExtras: true,
      faturas: true,
      parametros: { orderBy: { mes_ano: 'desc' } }
    }
  });

  if (!condominio) {
    return <div>Condomínio não encontrado.</div>;
  }

  const getVencimentoForCycle = (referente: string | null, data_pagamento: Date) => {
    let dataCalc = data_pagamento;
    if (referente && referente.match(/^\d{4}-\d{2}$/)) {
      const [y, m] = referente.split('-').map(Number);
      dataCalc = new Date(Date.UTC(y, m - 1, 15, 12, 0, 0));
    }
    
    let nextMonth = dataCalc.getUTCMonth() + 1; 
    let nextYear = dataCalc.getUTCFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
    
    const mesAnoStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`;
    const param = condominio.parametros.find(p => p.mes_ano <= mesAnoStr) || condominio.parametros[0];
    const diaVencimento = param ? param.dia_vencimento : 10;

    return new Date(Date.UTC(nextYear, nextMonth, diaVencimento, 12, 0, 0));
  };

  const earliestParametro = condominio.parametros.length > 0
    ? condominio.parametros.reduce((min, p) => p.mes_ano < min ? p.mes_ano : min, '9999-99')
    : '0000-00';

  // Calculate cash flow
  const allTransactions = [
    ...condominio.despesas
      .filter(d => d.referente >= earliestParametro)
      .map(d => ({
        data: d.data_pagamento,
        entrada: 0,
        saida: d.valor,
      })),
    ...condominio.creditosExtras
      .filter(c => (c.mes_ano || c.referente) >= earliestParametro)
      .map(c => ({
        data: c.data_pagamento || c.data_vencimento || c.data_lancamento,
        entrada: c.valor,
        saida: 0,
      })),
    ...condominio.faturas
      .filter(f => f.status === 'PAGO' || f.status === 'PARCIAL')
      .map(f => ({
        data: f.data_pagamento || f.data_vencimento,
        entrada: f.valor_pago || f.valor_total,
        saida: 0,
      })),
  ].sort((a, b) => a.data.getTime() - b.data.getTime());

  // Group by date
  const groupedByDate: Record<string, { data: Date; entradas: number; saidas: number }> = {};
  
  for (const t of allTransactions) {
    const dateStr = format(t.data, 'yyyy-MM-dd');
    if (!groupedByDate[dateStr]) {
      groupedByDate[dateStr] = {
        data: t.data,
        entradas: 0,
        saidas: 0,
      };
    }
    groupedByDate[dateStr].entradas += t.entrada;
    groupedByDate[dateStr].saidas += t.saida;
  }

  const sortedDates = Object.keys(groupedByDate).sort();

  let saldoAtual = condominio.saldo_inicial;
  const transacoesResumo = [];

  for (const dateStr of sortedDates) {
    const group = groupedByDate[dateStr];
    const saldoInicialDia = saldoAtual;
    const entradas = Number(group.entradas.toFixed(2));
    const saidas = Number(group.saidas.toFixed(2));
    saldoAtual = Number((saldoAtual + entradas - saidas).toFixed(2));
    
    transacoesResumo.push({
      data: group.data,
      saldoInicialDia,
      entradas,
      saidas,
      saldoFinal: saldoAtual,
    });
  }

  transacoesResumo.reverse(); // show newest first

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoAtual)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Extrato</CardTitle>
          <BalanceteGenerator />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Saldo Inicial</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Saldo Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacoesResumo.map((t, i) => (
                <TableRow key={i}>
                  <TableCell>{format(t.data, 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.saldoInicialDia)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {t.entradas > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.entradas) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {t.saidas > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.saidas) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.saldoFinal)}
                  </TableCell>
                </TableRow>
              ))}
              {transacoesResumo.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma transação encontrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
