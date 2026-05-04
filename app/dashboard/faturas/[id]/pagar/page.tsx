import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { PagarFaturaForm } from './pagar-fatura-form';

export const dynamic = 'force-dynamic';

export default async function PagarFaturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const fatura = await prisma.fatura.findUnique({
    where: { id, condominioId: session.user.condominioId },
    include: { proprietario: true },
  });

  if (!fatura) notFound();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Registrar Pagamento</h1>
      <PagarFaturaForm fatura={fatura} />
    </div>
  );
}
