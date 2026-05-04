'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export function SendWhatsappButton({ 
  faturaId, 
  telefone, 
  mesAno, 
  valor, 
  nome,
  condominioNome
}: { 
  faturaId: string; 
  telefone: string | null; 
  mesAno: string; 
  valor: number; 
  nome: string;
  condominioNome: string;
}) {
  const handleSend = () => {
    if (!telefone) {
      toast.error('Proprietário não possui telefone cadastrado');
      return;
    }

    // Clean phone number (remove specific characters, keep only digits)
    const cleanPhone = telefone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      toast.error('Número de telefone inválido ou incompleto');
      return;
    }

    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    
    // Resolve the domain
    const appUrl = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    
    const publicPdfLink = `${appUrl}/api/faturas-pdf/${faturaId}`;
    
    const message = `Olá, ${nome}!\n\nA sua fatura do *${condominioNome}* referente a *${mesAno}* no valor de *${valorFormatado}* já está disponível.\n\nVocê pode baixar e visualizar o PDF da sua fatura através do link seguro abaixo:\n📎 ${publicPdfLink}`;

    const encodedMessage = encodeURIComponent(message);
    
    // Add country code if it doesn't exist
    const whatsappNum = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (!telefone) {
    return (
      <Button variant="ghost" size="sm" title="Proprietário sem telefone cadastrado" disabled>
        <MessageCircle className="h-4 w-4 text-emerald-200" />
      </Button>
    );
  }

  return (
    <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSend} 
        title={`Enviar via WhatsApp para: ${telefone}`}
        className="hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 text-emerald-500"
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  );
}
