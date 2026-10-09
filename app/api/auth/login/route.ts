import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
  console.log('Login request received');
  try {
    const body = await request.json();
    console.log('Login body:', { ...body, password: '***' });
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.senha);

    if (!isValid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    await login({
      id: user.id,
      role: user.role,
      condominioId: user.condominioId,
      nome: user.nome,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login error:', error);
    const errorMsg = error?.message || String(error);
    const isDbConnectionError =
      errorMsg.includes('tenant') ||
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes("Can't reach database server") ||
      errorMsg.includes('PrismaClientInitializationError') ||
      error?.name === 'PrismaClientInitializationError';

    if (isDbConnectionError) {
      return NextResponse.json(
        {
          error:
            'O banco de dados (Supabase) está pausado ou inacessível. No plano gratuito, o Supabase pausa projetos inativos após 7 dias. Acesse o painel do Supabase (https://supabase.com/dashboard/project/luwzppwogjnktckkkuhl) e clique em "Restore project" para reativar o banco.',
          isDbConnectionError: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
