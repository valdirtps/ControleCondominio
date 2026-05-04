import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';
import { EditCondominioForm } from './edit-form';

export const dynamic = 'force-dynamic';

export default async function EditarCondominioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN_SISTEMA') {
    redirect('/dashboard');
  }

  const { id } = await params;

  const condominio = await prisma.condominio.findUnique({
    where: { id },
    include: {
      usuarios: {
        where: { role: 'ADMIN_CONDOMINIO' },
        take: 1,
      },
    },
  });

  if (!condominio) {
    redirect('/dashboard/condominios');
  }

  return <EditCondominioForm condominio={condominio} />;
}
