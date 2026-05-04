import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function CondominiosPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN_SISTEMA') {
    redirect('/dashboard');
  }

  const condominios = await prisma.condominio.findMany({
    include: {
      usuarios: {
        where: { role: 'ADMIN_CONDOMINIO' },
        take: 1,
      },
    },
    orderBy: { nome: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Condomínios</h1>
        <Button render={<Link href="/dashboard/condominios/novo" />}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Condomínios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Email Admin</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {condominios.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.cnpj}</TableCell>
                  <TableCell>{c.usuarios[0]?.nome || '-'}</TableCell>
                  <TableCell>{c.usuarios[0]?.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" render={<Link href={`/dashboard/condominios/${c.id}/editar`} />}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {condominios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum condomínio cadastrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
