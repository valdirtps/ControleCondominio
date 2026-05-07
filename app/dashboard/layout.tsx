import { ReactNode } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Home, Users, Settings, FileText, DollarSign, UserCheck } from 'lucide-react';
import prisma from '@/lib/db';
import { LogoutButton } from '@/components/logout-button';
import { IdleTimeout } from '@/components/idle-timeout';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const { user } = session;

  let condominioNome = '';
  if (user.condominioId) {
    const condominio = await prisma.condominio.findUnique({
      where: { id: user.condominioId },
      select: { nome: true }
    });
    if (condominio) {
      condominioNome = condominio.nome;
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <IdleTimeout />
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-50 border-r border-slate-800 shadow-sm hidden md:block">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">Gestão Condomínio</h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{user.nome}</p>
          {condominioNome && (
            <p className="text-sm text-red-500 font-bold mt-1">{condominioNome}</p>
          )}
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white font-medium">
            <Home size={18} /> Fluxo de Caixa
          </Link>
          
          {user.role === 'ADMIN_SISTEMA' && (
            <Link href="/dashboard/condominios" className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white font-medium">
              <Users size={18} /> Condomínios
            </Link>
          )}

          {user.role !== 'USUARIO' && user.role !== 'ADMIN_SISTEMA' && (
            <>
              <Link href="/dashboard/proprietarios" className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white font-medium">
                <Users size={18} /> Proprietários
              </Link>
              <Link href="/dashboard/sindico" className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white font-medium">
                <UserCheck size={18} /> Síndico
              </Link>
              <Link href="/dashboard/lancamentos" className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white font-medium">
                <DollarSign size={18} /> Lançamentos
              </Link>
              <Link href="/dashboard/faturas" className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white font-medium">
                <FileText size={18} /> Faturas
              </Link>
              <Link href="/dashboard/configuracoes" className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white font-medium">
                <Settings size={18} /> Configurações
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 text-slate-50 p-4 flex justify-between items-center shadow-sm">
          <div className="md:hidden">
            <div className="font-bold text-lg text-white">Gestão Condomínio</div>
            {condominioNome && <div className="text-sm text-red-500 font-bold">{condominioNome}</div>}
          </div>
          <div className="hidden md:block"></div>
          <LogoutButton />
        </header>

        {/* Page Content */}
        <div className="p-6 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
