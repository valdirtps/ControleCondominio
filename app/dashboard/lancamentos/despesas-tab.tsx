'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TIPOS_DESPESA = [
  'Conta Agua',
  'Conta Luz',
  'Zeladoria',
  'Jardinagem',
  'Manutencao',
  'Material Limpeza',
  'Outras Despesas',
  'Material Eletrico',
  'Judicial',
];

export function DespesasTab({ initialData, defaultMesAno }: { initialData: any[], defaultMesAno: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [despesaToDelete, setDespesaToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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

  const previousMesAno = getPreviousMonth(defaultMesAno);

  const defaultForm = {
    tipo: '',
    valor: 0,
    referente: previousMesAno,
    observacao: '',
    data_pagamento: '',
  };

  const [formData, setFormData] = useState(defaultForm);

  const handleOpenNew = () => {
    setFormData({ ...defaultForm, referente: getPreviousMonth(defaultMesAno) });
    setEditingId(null);
    setOpen(true);
  };

  const handleEdit = (despesa: any) => {
    setFormData({
      tipo: despesa.tipo,
      valor: despesa.valor,
      referente: despesa.referente,
      observacao: despesa.observacao || '',
      data_pagamento: despesa.data_pagamento ? new Date(despesa.data_pagamento).toISOString().split('T')[0] : '',
    });
    setEditingId(despesa.id);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!despesaToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/despesas/${despesaToDelete}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Despesa excluída com sucesso!');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao excluir despesa');
      }
    } catch (err) {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDespesaToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setDespesaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo) {
      toast.error('Selecione o tipo de despesa');
      return;
    }

    setLoading(true);

    try {
      const url = editingId ? `/api/despesas/${editingId}` : '/api/despesas';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          data_pagamento: new Date(formData.data_pagamento).toISOString(),
        }),
      });

      if (res.ok) {
        toast.success(editingId ? 'Despesa atualizada com sucesso!' : 'Despesa adicionada com sucesso!');
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch (err) {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Despesa' : 'Adicionar Despesa'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Despesa</Label>
                <Select value={formData.tipo} onValueChange={(value: string | null) => setFormData({...formData, tipo: value || ''})}>
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DESPESA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referente">Despesa referente:</Label>
                <Input id="referente" type="month" required value={formData.referente} onChange={e => setFormData({...formData, referente: e.target.value})} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input 
                  id="valor" 
                  type="text" 
                  required 
                  value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(formData.valor)} 
                  onChange={e => {
                    let value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, valor: Number(value) / 100});
                  }} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação (Opcional)</Label>
                <Input id="observacao" type="text" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_pagamento">Data de Pagamento</Label>
                <Input id="data_pagamento" type="date" required value={formData.data_pagamento} onChange={e => setFormData({...formData, data_pagamento: e.target.value})} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Despesa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Referente</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.tipo}</TableCell>
                  <TableCell>{d.referente}</TableCell>
                  <TableCell>{d.observacao || '-'}</TableCell>
                  <TableCell>{d.data_pagamento ? format(new Date(d.data_pagamento), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(d)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => confirmDelete(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {initialData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={4} className="text-right">Total:</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      initialData.reduce((acc, curr) => acc + curr.valor, 0)
                    )}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
              {initialData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">Nenhuma despesa lançada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
