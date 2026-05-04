"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

export function ProprietarioForm({ initialData }: { initialData?: any }) {
  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    apartamento: initialData?.apartamento || "",
    telefone: initialData?.telefone || "",
    email: initialData?.email || "",
    saldo_devedor_inicial: initialData?.saldo_devedor_inicial || 0,
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData
        ? `/api/proprietarios/${initialData.id}`
        : "/api/proprietarios";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(
          initialData ? "Atualizado com sucesso!" : "Criado com sucesso!",
        );
        router.push("/dashboard/proprietarios");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (err) {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/proprietarios/${initialData.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Excluído com sucesso!");
        router.push("/dashboard/proprietarios");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir");
      }
    } catch (err) {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apartamento">Apartamento *</Label>
              <Input
                id="apartamento"
                value={formData.apartamento}
                onChange={(e) =>
                  setFormData({ ...formData, apartamento: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="saldo">Saldo Devedor Inicial (R$)</Label>
              <Input
                id="saldo"
                type="number"
                step="0.01"
                min="0"
                value={formData.saldo_devedor_inicial}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    saldo_devedor_inicial: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Aplicado apenas na primeira fatura gerada para este imóvel.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <div>
            {initialData && (
              <Dialog>
                <DialogTrigger
                  render={<Button variant="destructive" type="button" />}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir Proprietário</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja excluir este proprietário? Esta
                      ação não pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose
                      render={<Button variant="outline" type="button" />}
                    >
                      Cancelar
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? "Excluindo..." : "Confirmar Exclusão"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
