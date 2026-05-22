'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SindicoSecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorSindicoId: string;
  creatorSindicoNome: string;
  creatorSindicoEmail: string;
  onSuccess: (code: string) => void;
}

export function SindicoSecurityDialog({
  open,
  onOpenChange,
  creatorSindicoId,
  creatorSindicoNome,
  creatorSindicoEmail,
  onSuccess,
}: SindicoSecurityDialogProps) {
  const [loadingCode, setLoadingCode] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [testCode, setTestCode] = useState<string | null>(null);

  const handleRequestCode = async () => {
    setLoadingCode(true);
    try {
      const res = await fetch('/api/verificacao/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sindicoId: creatorSindicoId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCodeRequested(true);
        // Expose the temporary code as requested/approved for testing & developer usability
        setTestCode(data.code);
        toast.success(`Código de segurança enviado para o e-mail: ${creatorSindicoEmail}`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Erro ao gerar código');
      }
    } catch {
      toast.error('Erro de conexão ao solicitar código');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleConfirm = () => {
    if (!securityCode || securityCode.length < 5) {
      toast.error('Digite um código de segurança válido');
      return;
    }
    // Update sessionStorage so the approval persists throughout the session
    sessionStorage.setItem(`sindico_code_${creatorSindicoId}`, securityCode);
    onSuccess(securityCode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Restrição de Segurança</DialogTitle>
          <DialogDescription className="text-sm mt-2 text-slate-600">
            Este lançamento foi realizado pelo síndico anterior ({creatorSindicoNome}). 
            Para poder alterá-lo ou excluí-lo, você precisará de uma autorização de segurança temporária.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-sm">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs leading-relaxed text-slate-700 space-y-1">
            <span className="font-semibold block text-slate-800">Responsável pelo registro original:</span>
            <span>Nome: {creatorSindicoNome}</span>
            <br />
            <span>E-mail Pessoal: {creatorSindicoEmail}</span>
          </div>

          {!codeRequested ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Ao clicar no botão abaixo, um código de verificação de 6 dígitos será enviado ao e-mail pessoal registrado deste síndico anterior.
              </p>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={handleRequestCode}
                disabled={loadingCode}
              >
                {loadingCode ? 'Solicitando código...' : 'Solicitar Código de Segurança'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="authCode" className="text-xs font-semibold text-slate-700">Código de Autorização</Label>
                <Input
                  id="authCode"
                  placeholder="Digite o código de 6 digitos"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  className="font-mono tracking-widest text-center text-lg"
                  maxLength={6}
                />
              </div>

              {testCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <p className="font-semibold">Código Recebido (Simulação de E-mail):</p>
                  <p className="mt-1 font-mono text-center text-lg font-bold select-all tracking-wider">{testCode}</p>
                  <p className="mt-1 text-[10px] text-amber-700 opacity-90 leading-tight">
                    *Esta caixa de simulação auxilia nos testes do sistema de segurança, permitindo o input e validação instantâneos sem precisar sair.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={!codeRequested}
          >
            Validar e Prosseguir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
