import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateFaturaPDFBuffer } from '@/lib/fatura-pdf';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Using ID without password, but CUIDs are reasonably hard to guess
    const fatura = await prisma.fatura.findUnique({
      where: { id },
      include: {
        proprietario: true,
        condominio: {
          include: {
            sindicos: { where: { ativo: true }, include: { proprietario: true } }
          }
        }
      },
    });

    if (!fatura) {
      return new NextResponse('Fatura não encontrada', { status: 404 });
    }

    const pdfBuffer = await generateFaturaPDFBuffer(fatura);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Fatura_${fatura.mes_ano}_Apto_${fatura.proprietario.apartamento}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF público:', error);
    return new NextResponse('Erro interno ao gerar PDF', { status: 500 });
  }
}
