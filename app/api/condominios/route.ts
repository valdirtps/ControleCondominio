import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN_SISTEMA') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { nome, cnpj, endereco, numero, cidade, uf, cep, saldo_inicial, adminNome, adminEmail, adminSenha } = data;

    if (!nome || !cnpj || !adminNome || !adminEmail || !adminSenha) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'E-mail do administrador já está em uso' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(adminSenha, 10);

    const condominio = await prisma.$transaction(async (tx) => {
      const novoCondominio = await tx.condominio.create({
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

      await tx.user.create({
        data: {
          nome: adminNome,
          email: adminEmail,
          senha: hashedPassword,
          role: 'ADMIN_CONDOMINIO',
          condominioId: novoCondominio.id,
        },
      });

      return novoCondominio;
    });

    return NextResponse.json(condominio);
  } catch (error) {
    console.error('Erro ao criar condomínio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
