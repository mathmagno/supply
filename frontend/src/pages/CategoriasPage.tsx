import { useState } from "react";
import { useCategorias, useCriarCategoria, useAtualizarCategoria, useRemoverCategoria } from "@/hooks/useCategorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarData } from "@/lib/utils";
import type { Categoria } from "@/lib/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function CategoriasPage() {
  const { data: categorias = [] } = useCategorias();
  const criar = useCriarCategoria();
  const atualizar = useAtualizarCategoria();
  const remover = useRemoverCategoria();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");

  function abrirNova() {
    setEditando(null);
    setNome("");
    setModalAberto(true);
  }

  function abrirEditar(cat: Categoria) {
    setEditando(cat);
    setNome(cat.nome);
    setModalAberto(true);
  }

  async function salvar() {
    if (!nome.trim()) return;
    if (editando) {
      await atualizar.mutateAsync({ id: editando.id, nome });
    } else {
      await criar.mutateAsync({ nome });
    }
    setModalAberto(false);
  }

  async function confirmarRemover(id: number) {
    if (confirm("Remover esta categoria? As especificações vinculadas serão afetadas.")) {
      await remover.mutateAsync(id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={abrirNova}>
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{categorias.length} categoria(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{cat.nome}</p>
                  <p className="text-xs text-muted-foreground">Criada em {formatarData(cat.criado_em)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => abrirEditar(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => confirmarRemover(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {categorias.length === 0 && (
              <p className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma categoria cadastrada.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mouse, Teclado, Monitor"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && salvar()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={criar.isPending || atualizar.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
