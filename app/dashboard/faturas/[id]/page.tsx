import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { FaturaView } from './fatura-view';

export const dynamic = 'force-dynamic';

export default async function FaturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const fatura = await prisma.fatura.findUnique({
    where: { id, condominioId: session.user.condominioId },
    include: {
      proprietario: true,
      condominio: {
        include: {
          sindicos: { where: { ativo: true }, include: { proprietario: true } }
        }
      }
    }
  });

  if (!fatura) notFound();

  return <FaturaView fatura={fatura} />;
}
