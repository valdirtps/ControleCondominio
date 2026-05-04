import { ReactNode } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Home, Users, Settings, FileText, DollarSign, UserCheck } from 'lucide-react';
import prisma from '@/lib/db';
import { LogoutButton } from '@/components/logout-button';

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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:block">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Gestão Condomínio</h1>
          <p className="text-sm text-gray-500 font-medium">{user.nome}</p>
          {condominioNome && (
            <p className="text-sm text-red-600 font-bold mt-1">{condominioNome}</p>
          )}
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-gray-700">
            <Home size={20} /> Fluxo de Caixa
          </Link>
          
          {user.role === 'ADMIN_SISTEMA' && (
            <Link href="/dashboard/condominios" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-gray-700">
              <Users size={20} /> Condomínios
            </Link>
          )}

          {user.role !== 'USUARIO' && user.role !== 'ADMIN_SISTEMA' && (
            <>
              <Link href="/dashboard/proprietarios" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-gray-700">
                <Users size={20} /> Proprietários
              </Link>
              <Link href="/dashboard/sindico" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-gray-700">
                <UserCheck size={20} /> Síndico
              </Link>
              <Link href="/dashboard/lancamentos" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-gray-700">
                <DollarSign size={20} /> Lançamentos
              </Link>
              <Link href="/dashboard/faturas" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-gray-700">
                <FileText size={20} /> Faturas
              </Link>
              <Link href="/dashboard/configuracoes" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-gray-700">
                <Settings size={20} /> Configurações
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
          <div className="md:hidden">
            <div className="font-bold text-lg">Gestão Condomínio</div>
            {condominioNome && <div className="text-sm text-red-600 font-bold">{condominioNome}</div>}
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
