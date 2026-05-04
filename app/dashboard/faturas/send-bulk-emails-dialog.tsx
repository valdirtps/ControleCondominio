'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mailbox } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function SendBulkEmailsDialog({ meses }: { meses: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedMes, setSelectedMes] = useState(meses[0] || '');

  const handleSend = async () => {
    if (!selectedMes) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/faturas/enviar-email-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes_ano: selectedMes })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        setIsOpen(false);
      } else {
        toast.error(data.error || 'Erro ao enviar e-mails em lote.');
      }
    } catch (e) {
      toast.error('Ocorreu um erro inesperado ao conectar com o servidor.');
    } finally {
      setIsSending(false);
    }
  };

  if (meses.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="secondary" className="gap-2" />}>
        <Mailbox className="h-4 w-4" />
        Enviar Lote por E-mail
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Faturas em Lote</DialogTitle>
          <DialogDescription>
            Selecione o mês de referência. O sistema enviará a fatura por e-mail automaticamente 
            para todos os proprietários que possuírem e-mail cadastrado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Mês de Referência (Mês/Ano)</label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
            >
              {meses.map(mes => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>Cancelar</Button>
          <Button onClick={handleSend} disabled={isSending || !selectedMes}>
            {isSending ? 'Processando Envios...' : 'Confirmar Envios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
