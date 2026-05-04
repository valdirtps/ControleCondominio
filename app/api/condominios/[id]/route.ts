import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN_SISTEMA') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    const { nome, cnpj, endereco, numero, cidade, uf, cep, saldo_inicial, adminNome, adminEmail } = data;

    if (!nome || !cnpj || !adminNome || !adminEmail) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
    }

    // Check if email is being used by another user
    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser && existingUser.condominioId !== id) {
      return NextResponse.json({ error: 'E-mail do administrador já está em uso' }, { status: 400 });
    }

    const condominio = await prisma.$transaction(async (tx) => {
      const updatedCondominio = await tx.condominio.update({
        where: { id },
        data: {
          nome,
          cnpj,
          endereco: endereco || '',
          numero: numero || '',
          cidade: cidade || '',
          uf: uf || '',
          cep: cep || '',
          saldo_inicial: saldo_inicial || 0,
        },
      });

      const adminUser = await tx.user.findFirst({
        where: { condominioId: id, role: 'ADMIN_CONDOMINIO' },
      });

      if (adminUser) {
        await tx.user.update({
          where: { id: adminUser.id },
          data: {
            nome: adminNome,
            email: adminEmail,
          },
        });
      }

      return updatedCondominio;
    });

    return NextResponse.json(condominio);
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN_SISTEMA') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check for existing relations
    const [
      proprietariosCount,
      faturasCount,
      despesasCount,
      valoresMensaisCount,
      chamadasExtrasCount,
      valoresIndividuaisCount,
      creditosExtrasCount
    ] = await Promise.all([
      prisma.proprietario.count({ where: { condominioId: id } }),
      prisma.fatura.count({ where: { condominioId: id } }),
      prisma.despesa.count({ where: { condominioId: id } }),
      prisma.valoresMensais.count({ where: { condominioId: id } }),
      prisma.chamadaExtra.count({ where: { condominioId: id } }),
      prisma.valoresIndividuais.count({ where: { condominioId: id } }),
      prisma.creditoExtra.count({ where: { condominioId: id } }),
    ]);

    if (
      proprietariosCount > 0 ||
      faturasCount > 0 ||
      despesasCount > 0 ||
      valoresMensaisCount > 0 ||
      chamadasExtrasCount > 0 ||
      valoresIndividuaisCount > 0 ||
      creditosExtrasCount > 0
    ) {
      return NextResponse.json(
        { error: 'Não é possível excluir este condomínio pois ele possui vínculos (proprietários, faturas, despesas, etc).' },
        { status: 400 }
      );
    }

    // If no relations, delete the condominio and its direct dependencies (usuarios, parametros, sindicos)
    await prisma.$transaction(async (tx) => {
      await tx.parametros.deleteMany({ where: { condominioId: id } });
      await tx.sindico.deleteMany({ where: { condominioId: id } });
      await tx.user.deleteMany({ where: { condominioId: id } });
      await tx.condominio.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir condomínio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
