import { ProprietarioForm } from '../../novo/proprietario-form';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditarProprietarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const proprietario = await prisma.proprietario.findUnique({
    where: { id, condominioId: session.user.condominioId },
  });

  if (!proprietario) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Editar Proprietário</h1>
      <ProprietarioForm initialData={proprietario} />
    </div>
  );
}
