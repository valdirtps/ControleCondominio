import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { GerarFaturasDialog } from './gerar-faturas-dialog';
import { SendEmailButton } from './send-email-button';
import { SendWhatsappButton } from './send-whatsapp-button';
import { SendBulkEmailsDialog } from './send-bulk-emails-dialog';
import { SendBulkWhatsappDialog } from './send-bulk-whatsapp-dialog';
import Link from 'next/link';

export default async function FaturasPage() {
  const session = await getSession();
  if (!session) return null;

  const faturas = await prisma.fatura.findMany({
    where: { condominioId: session.user.condominioId },
    include: { proprietario: true, condominio: true },
    orderBy: [{ mes_ano: 'desc' }, { proprietario: { apartamento: 'asc' } }],
  });

  // Extract unique mes_ano strings for the bulk email dropdown
  const uniqueMesAno = Array.from(new Set(faturas.map(f => f.mes_ano)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Faturas</h1>
        <div className="flex space-x-3">
          <SendBulkWhatsappDialog meses={uniqueMesAno} />
          <SendBulkEmailsDialog meses={uniqueMesAno} />
          <GerarFaturasDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês/Ano</TableHead>
                <TableHead>Apto</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Multa (Mês Anterior)</TableHead>
                <TableHead className="text-right">Acréscimo no Pgto</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faturas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.mes_ano}</TableCell>
                  <TableCell>{f.proprietario.apartamento}</TableCell>
                  <TableCell>{f.proprietario.nome}</TableCell>
                  <TableCell>{format(new Date(new Date(f.data_vencimento).getTime() + new Date().getTimezoneOffset() * 60000), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    {f.data_pagamento 
                      ? format(new Date(new Date(f.data_pagamento).getTime() + new Date().getTimezoneOffset() * 60000), 'dd/MM/yyyy') 
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      try {
                        const detalhes = JSON.parse(f.detalhes || '{"itens":[]}');
                        const multaAnterior = detalhes.itens
                          ?.filter((i: any) => i.descricao.toLowerCase().includes('multa') || i.descricao.toLowerCase().includes('juros'))
                          .reduce((acc: number, item: any) => acc + item.valor, 0) || 0;
                        return multaAnterior > 0 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(multaAnterior)
                          : '-';
                      } catch {
                        return '-';
                      }
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(f.multa + f.juros) > 0 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.multa + f.juros)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.valor_total)}</TableCell>
                  <TableCell>
                    <Badge variant={f.status === 'PAGO' ? 'default' : f.status === 'ATRASADO' ? 'destructive' : 'secondary'}>
                      {f.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    {f.status !== 'PAGO' && (
                      <Button variant="default" size="sm" render={<Link href={`/dashboard/faturas/${f.id}/pagar`} />}>
                        Pagar
                      </Button>
                    )}
                    <Button variant="outline" size="sm" render={<Link href={`/dashboard/faturas/${f.id}`} />}>
                      PDF
                    </Button>
                    <SendWhatsappButton faturaId={f.id} telefone={f.proprietario.telefone} mesAno={f.mes_ano} valor={f.valor_total} nome={f.proprietario.nome} condominioNome={f.condominio.nome} />
                    <SendEmailButton faturaId={f.id} email={f.proprietario.email} />
                  </TableCell>
                </TableRow>
              ))}
              {faturas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-4">Nenhuma fatura gerada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
