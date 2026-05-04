'use client';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function BalancetePrintButton() {
  return (
    <Button onClick={() => window.print()} variant="outline" className="gap-2">
      <Printer size={16} /> Print Relatório
    </Button>
  );
}
