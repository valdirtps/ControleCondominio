'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <Button onClick={handleLogout} variant="ghost" size="sm" className="flex items-center gap-2">
      <LogOut size={16} /> Sair
    </Button>
  );
}
