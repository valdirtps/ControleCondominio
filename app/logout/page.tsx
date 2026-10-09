'use client';

import { useEffect } from 'react';

export default function LogoutPage() {
  useEffect(() => {
    const doLogout = async () => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
          localStorage.clear();
          document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;';
        }
        await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?logout=true';
        }
      }
    };

    doLogout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">Saindo do sistema...</p>
      </div>
    </div>
  );
}
