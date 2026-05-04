'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DespesasTab } from './despesas-tab';
import { ValoresMensaisTab } from './valores-mensais-tab';
import { ValoresExclusivosTab } from './valores-exclusivos-tab';
import { CreditosExtrasTab } from './creditos-extras-tab';
import { ChamadasExtrasTab } from './chamadas-extras-tab';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LancamentosClient({ 
  despesas, 
  valoresMensais,
  chamadasExtras,
  valoresIndividuais,
  creditosExtras,
  parametros,
  sindico,
  proprietarios
}: { 
  despesas: any[], 
  valoresMensais: any[],
  chamadasExtras: any[],
  valoresIndividuais: any[],
  creditosExtras: any[],
  parametros: any[],
  sindico: any,
  proprietarios: any[]
}) {
  const [mesAno, setMesAno] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const getPreviousMonth = (yyyyMM: string) => {
    if (!yyyyMM) return '';
    const [yearStr, monthStr] = yyyyMM.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const previousMesAno = getPreviousMonth(mesAno);
  const filteredDespesas = despesas.filter(d => d.referente === previousMesAno);
  const filteredValoresMensais = valoresMensais.filter(v => v.mes_ano === mesAno);
  const filteredValoresIndividuais = valoresIndividuais.filter(v => v.mes_ano === mesAno);
  const filteredCreditosExtras = creditosExtras.filter(c => c.mes_ano === mesAno);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
        <div className="flex items-center gap-4 bg-card p-2 rounded-lg border shadow-sm">
          <Label htmlFor="global_mes_ano" className="whitespace-nowrap font-medium">Mês/Ano (ex: 2026-03)</Label>
          <Input 
            id="global_mes_ano" 
            type="month" 
            value={mesAno} 
            onChange={e => setMesAno(e.target.value)} 
            className="w-40"
          />
        </div>
      </div>
      
      <Tabs defaultValue="valores-mensais">
        <TabsList>
          <TabsTrigger value="valores-mensais">Valores Mensais</TabsTrigger>
          <TabsTrigger value="chamadas-extras">Chamadas Extras</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="valores-exclusivos">Valores Exclusivos</TabsTrigger>
          <TabsTrigger value="creditos-extras">Outros Créditos</TabsTrigger>
        </TabsList>
        <TabsContent value="valores-mensais">
          <ValoresMensaisTab 
            initialData={filteredValoresMensais} 
            allValoresMensais={valoresMensais}
            defaultMesAno={mesAno} 
            chamadasExtras={chamadasExtras}
            parametros={parametros}
            sindico={sindico}
            proprietarios={proprietarios}
          />
        </TabsContent>
        <TabsContent value="chamadas-extras">
          <ChamadasExtrasTab 
            initialData={chamadasExtras.filter(c => c.mes_ano === mesAno)} 
            defaultMesAno={mesAno}
            chamadasExtrasAll={chamadasExtras}
          />
        </TabsContent>
        <TabsContent value="despesas">
          <DespesasTab initialData={filteredDespesas} defaultMesAno={mesAno} />
        </TabsContent>
        <TabsContent value="valores-exclusivos">
          <ValoresExclusivosTab 
            initialData={filteredValoresIndividuais} 
            defaultMesAno={mesAno} 
            proprietarios={proprietarios}
            parametros={parametros}
          />
        </TabsContent>
        <TabsContent value="creditos-extras">
          <CreditosExtrasTab 
            initialData={filteredCreditosExtras} 
            defaultMesAno={mesAno} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
