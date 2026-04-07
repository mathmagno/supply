import { useState } from "react";
import { useCategorias, useCriarCategoria, useAtualizarCategoria, useRemoverCategoria, useSincronizarSegmentos } from "@/hooks/useCategorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatarData } from "@/lib/utils";
import type { Categoria } from "@/lib/types";
import { Plus, Pencil, Trash2, RefreshCw, Tag } from "lucide-react";

export default function CategoriasPage() {
  const { data: categorias = [] } = useCategorias();
  const criar = useCriarCategoria();
  const atualizar = useAtualizarCategoria();
  const remover = useRemoverCategoria();
  const sincronizar = useSincronizarSegmentos();

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => sincronizar.mutate()}
            disabled={sincronizar.isPending}
            title="Importa automaticamente os segmentos de fornecedores como categorias"
          >
            <RefreshCw className={`h-4 w-4 ${sincronizar.isPending ? "animate-spin" : ""}`} />
            Sincronizar segmentos
          </Button>
          <Button onClick={abrirNova}>
            <Plus className="h-4 w-4" /> Nova categoria
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-blue-50/50 border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
        <Tag className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          As categorias espelham os <strong>segmentos de fornecedores</strong>. Clique em <strong>Sincronizar segmentos</strong> para importar automaticamente todos os segmentos cadastrados em Fornecedores. Novos segmentos criados em Fornecedores são adicionados aqui automaticamente.
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{categorias.length} categoria(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{cat.nome}</p>
                    <p className="text-xs text-muted-foreground">Criada em {formatarData(cat.criado_em)}</p>
                  </div>
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
              <div className="py-10 text-center space-y-2">
                <p className="text-muted-foreground text-sm">Nenhuma categoria cadastrada.</p>
                <Button variant="outline" size="sm" onClick={() => sincronizar.mutate()}>
                  <RefreshCw className="h-3.5 w-3.5" /> Importar dos segmentos
                </Button>
              </div>
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
              placeholder="Ex: TI, Construção, Alimentos..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && salvar()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={criar.isPending || atualizar.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
