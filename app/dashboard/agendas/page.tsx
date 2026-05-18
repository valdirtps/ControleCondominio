import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { AgendasClient } from "./agendas-client";

export default async function AgendasPage() {
  const session = await getSession();

  if (!session || (!session.user.condominioId && session.user.role !== "ADMIN_SISTEMA")) {
    redirect("/login");
  }

  const agendas = await prisma.agendaServico.findMany({
    where: {
      condominioId: session.user.condominioId || undefined,
    },
    orderBy: {
      data_agendamento: "desc",
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Agenda de Serviços</h2>
      </div>
      <AgendasClient data={agendas} condominioId={session.user.condominioId || ""} />
    </div>
  );
}
