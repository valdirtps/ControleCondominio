import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { SindicoManager } from './sindico-manager';

export default async function SindicoPage() {
  const session = await getSession();
  if (!session) return null;

  const sindicos = await prisma.sindico.findMany({
    where: { condominioId: session.user.condominioId },
    include: { proprietario: true },
    orderBy: { data_inicio: 'desc' },
  });

  const proprietarios = await prisma.proprietario.findMany({
    where: { condominioId: session.user.condominioId },
    orderBy: { apartamento: 'asc' },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <SindicoManager sindicos={sindicos} proprietarios={proprietarios} />
    </div>
  );
}
