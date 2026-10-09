'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  variant?: 'ghost' | 'outline' | 'default' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LogoutButton({ className, variant = 'ghost', size = 'sm' }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Limpa storages locais do navegador
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.clear();
          localStorage.clear();
          // Tenta limpar cookies acessíveis no documento
          document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;';
        } catch (e) {
          console.warn('Error clearing storage:', e);
        }
      }

      // 2. Chama API de logout no servidor
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 3. Força redirecionamento completo para a tela de login
      if (typeof window !== 'undefined') {
        window.location.href = '/login?logout=true';
      } else {
        router.push('/login');
      }
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 cursor-pointer ${className || ''}`}
      title="Sair do sistema"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      <span>{loading ? 'Saindo...' : 'Sair'}</span>
    </Button>
  );
}

