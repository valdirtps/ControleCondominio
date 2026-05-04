import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { ConfiguracoesForm } from './configuracoes-form';

export default async function ConfiguracoesPage() {
  const session = await getSession();
  if (!session) return null;

  const parametros = await prisma.parametros.findMany({
    where: { condominioId: session.user.condominioId },
    orderBy: { mes_ano: 'desc' }
  });

  const parametrosComStatus = await Promise.all(parametros.map(async (p, index) => {
    const nextParam = index > 0 ? parametros[index - 1] : null;
    const isOldest = index === parametros.length - 1;
    
    const whereClause: any = {
      condominioId: session.user.condominioId,
      mes_ano: {}
    };
    
    if (!isOldest) {
      whereClause.mes_ano.gte = p.mes_ano;
    }
    
    if (nextParam) {
      whereClause.mes_ano.lt = nextParam.mes_ano;
    }

    // If there are no conditions on mes_ano, remove it to avoid empty object query
    if (Object.keys(whereClause.mes_ano).length === 0) {
      delete whereClause.mes_ano;
    }

    const [faturasCount, valoresMensaisCount, chamadasExtrasCount, valoresIndividuaisCount] = await Promise.all([
      prisma.fatura.count({ where: whereClause }),
      prisma.valoresMensais.count({ where: whereClause }),
      prisma.chamadaExtra.count({ where: whereClause }),
      prisma.valoresIndividuais.count({ where: whereClause }),
    ]);
    const isLocked = (faturasCount + valoresMensaisCount + chamadasExtrasCount + valoresIndividuaisCount) > 0;
    return { 
      id: p.id,
      mes_ano: p.mes_ano,
      dia_vencimento: p.dia_vencimento,
      dias_isencao_multa: p.dias_isencao_multa,
      multa_percentual: p.multa_percentual,
      dividir_rateio_menos_um: p.dividir_rateio_menos_um,
      isLocked 
    };
  }));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Configurações do Condomínio</h1>
      <ConfiguracoesForm initialData={parametrosComStatus} />
    </div>
  );
}
