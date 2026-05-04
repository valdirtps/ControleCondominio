'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, CheckCircle, RefreshCcw, Hand } from 'lucide-react';
import { toast } from 'sonner';

export function SendBulkWhatsappDialog({ meses }: { meses: string[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMesAno, setSelectedMesAno] = useState<string>('');
  const [faturas, setFaturas] = useState<any[]>([]);
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({});

  const handleFetchFaturas = async () => {
    if (!selectedMesAno) {
      toast.error('Selecione um mês');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/faturas/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes_ano: selectedMesAno }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar');
      
      setFaturas(data.faturas);
      setSentStatus({}); // Reset sent statuses when loading new batch
      toast.success(`${data.faturas.length} contatos encontrados!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const enviarWhatsAppIndividual = (fatura: any) => {
    const { telefone, nome } = fatura.proprietario;
    const condominioNome = fatura.condominio?.nome || 'Condomínio';
    
    if (!telefone) return;
    
    const cleanPhone = telefone.replace(/\D/g, '');
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor_total);
    const appUrl = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const publicPdfLink = `${appUrl}/api/faturas-pdf/${fatura.id}`;
    
    const message = `Olá, ${nome}!\n\nA sua fatura do *${condominioNome}* referente a *${fatura.mes_ano}* no valor de *${valorFormatado}* já está disponível.\n\nVocê pode baixar e visualizar o PDF da sua fatura através do link seguro abaixo:\n📎 ${publicPdfLink}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNum = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodedMessage}`;
    
    // Mark as sent visually
    setSentStatus(prev => ({ ...prev, [fatura.id]: true }));

    // Open WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendNext = () => {
    const nextUnsent = faturas.find(f => !sentStatus[f.id]);
    if (nextUnsent) {
      enviarWhatsAppIndividual(nextUnsent);
    } else {
      toast.success('Todos os disparos desta lista já foram abertos!');
    }
  };

  return (
    <>
      <Button variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => setOpen(true)}>
        <MessageCircle className="mr-2 h-4 w-4" /> Disparo Lote WhatsApp
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Disparo Ágil via WhatsApp</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-md text-sm flex gap-3 items-start border border-emerald-100">
             <Hand className="h-5 w-5 text-emerald-600 shrink-0" />
             <p>Devido à política anti-spam rigorosa do WhatsApp, não é permitido abrir dezenas de mensagens sozinhas e escondidas no servidor. <strong>Nesta tela, preparamos tudo para você: </strong> Basta ir apertando em &quot;Abrir Próximo&quot; para ir enviando rapidamente!</p>
          </div>

          {!faturas.length ? (
            <div className="flex gap-4 items-center mt-6">
              <div className="flex-1">
                <Select value={selectedMesAno} onValueChange={(val) => setSelectedMesAno(val || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleFetchFaturas} disabled={loading || !selectedMesAno} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : 'Carregar Tabela'}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                <span className="text-sm text-gray-600">
                  Enviados: <strong>{Object.keys(sentStatus).length}</strong> de <strong>{faturas.length}</strong>
                </span>
                
                <Button 
                   onClick={handleSendNext} 
                   className="bg-emerald-600 hover:bg-emerald-700"
                   disabled={Object.keys(sentStatus).length === faturas.length}
                >
                  Abrir Próximo <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-3 w-16">Apto</th>
                      <th className="p-3">Proprietário</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faturas.map((fatura) => (
                      <tr key={fatura.id} className={`border-b hover:bg-gray-50 ${sentStatus[fatura.id] ? 'bg-emerald-50/30' : ''}`}>
                        <td className="p-3 font-medium">{fatura.proprietario.apartamento}</td>
                        <td className="p-3">{fatura.proprietario.nome}</td>
                        <td className="p-3 text-right">
                          {sentStatus[fatura.id] ? (
                            <span className="inline-flex items-center text-emerald-600 font-medium text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" /> Aberto
                            </span>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => enviarWhatsAppIndividual(fatura)}
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              Enviar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                 <Button variant="ghost" onClick={() => setFaturas([])}>Voltar / Trocar Mês</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
