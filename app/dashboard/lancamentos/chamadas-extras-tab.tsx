'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getActiveChamadasExtras } from '@/lib/chamadas-extras';

export function ChamadasExtrasTab({ 
  defaultMesAno,
  chamadasExtrasAll
}: { 
  initialData: any[], 
  defaultMesAno: string,
  chamadasExtrasAll: any[]
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const defaultForm = {
    mes_ano: defaultMesAno,
    referente: '',
    valor_total: 0,
    parcelas: 1,
    valor: 0,
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (formData.valor_total > 0 && formData.parcelas > 0) {
      setFormData(prev => ({
        ...prev,
        valor: prev.valor_total / prev.parcelas
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        valor: 0
      }));
    }
  }, [formData.valor_total, formData.parcelas]);

  const handleOpenNew = () => {
    setFormData({ ...defaultForm, mes_ano: defaultMesAno });
    setEditingId(null);
    setOpen(true);
  };

  const handleEdit = (data: any) => {
    setFormData({
      mes_ano: data.mes_ano,
      referente: data.referente,
      valor_total: data.valor_total || (data.valor * (data.parcelas || 1)),
      parcelas: data.parcelas || 1,
      valor: data.valor,
    });
    setEditingId(data.id);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chamadas-extras/${itemToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Chamada Extra excluída com sucesso!');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao excluir');
      }
    } catch (err) {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.referente) {
      toast.error('Informe o campo referente');
      return;
    }
    if (formData.valor_total <= 0) {
      toast.error('Informe o valor total válido');
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/chamadas-extras/${editingId}` : '/api/chamadas-extras';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? 'Atualizado com sucesso!' : 'Lançado com sucesso!');
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
          <Plus className="mr-2 h-4 w-4" /> Lançar Chamada Extra
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Chamada Extra' : 'Lançar Chamada Extra'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Mês/Ano</Label>
              <Input type="month" value={formData.mes_ano} disabled />
            </div>
            <div className="space-y-2">
              <Label>Referente a</Label>
              <Input 
                required
                placeholder="Ex: Pintura da Fachada"
                value={formData.referente}
                onChange={e => setFormData({ ...formData, referente: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input 
                  required
                  value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(formData.valor_total)}
                  onChange={e => {
                    let value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, valor_total: Number(value) / 100});
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>N° de Parcelas</Label>
                <Input 
                  type="number" 
                  min="1"
                  required
                  value={formData.parcelas}
                  onChange={e => setFormData({...formData, parcelas: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subtotal (Valor por Parcela - R$)</Label>
              <Input 
                disabled
                className="bg-muted font-semibold text-primary"
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor)}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Chamada Extra</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta chamada extra? Isso removerá a cobrança deste mês.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Excluindo...' : 'Sim, excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês/Ano</TableHead>
                <TableHead>Referente</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Progresso</TableHead>
                <TableHead className="text-right">Valor Parcela</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getActiveChamadasExtras(chamadasExtrasAll, defaultMesAno).map((d) => {
                const isCurrentMonth = d.mes_ano === defaultMesAno;
                return (
                  <TableRow key={d.id}>
                    <TableCell>{d.mes_ano}</TableCell>
                    <TableCell>{d.referente}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor_total || (d.valor * (d.parcelas||1)))}</TableCell>
                    <TableCell className="text-right">{d.current_parcela}/{d.parcelas}</TableCell>
                    <TableCell className="text-right font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)}</TableCell>
                    <TableCell className="text-right">
                      {isCurrentMonth ? (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(d)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => { setItemToDelete(d.id); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground mr-2">Visualização</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {getActiveChamadasExtras(chamadasExtrasAll, defaultMesAno).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">Nenhuma chamada extra ativa para este mês.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
