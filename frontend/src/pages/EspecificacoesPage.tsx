import { useState } from "react";
import { useEspecificacoes, useCriarEspecificacao, useAtualizarEspecificacao, useRemoverEspecificacao } from "@/hooks/useEspecificacoes";
import { useCategorias } from "@/hooks/useCategorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda } from "@/lib/utils";
import type { Especificacao } from "@/lib/types";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function EspecificacoesPage() {
  const [busca, setBusca] = useState("");
  const [catFiltro, setCatFiltro] = useState<number | undefined>();
  const { data: especificacoes = [] } = useEspecificacoes(catFiltro, busca || undefined);
  const { data: categorias = [] } = useCategorias();

  const criar = useCriarEspecificacao();
  const atualizar = useAtualizarEspecificacao();
  const remover = useRemoverEspecificacao();

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Especificacao | null>(null);
  const [form, setForm] = useState({
    categoria_id: "",
    codigo: "",
    marca: "",
    descricao: "",
    unidade: "UN",
    custo_planejado: "",
    ultimo_custo: "",
  });

  function abrirNova() {
    setEditando(null);
    setForm({ categoria_id: "", codigo: "", marca: "", descricao: "", unidade: "UN", custo_planejado: "", ultimo_custo: "" });
    setModal(true);
  }

  function abrirEditar(e: Especificacao) {
    setEditando(e);
    setForm({
      categoria_id: String(e.categoria_id),
      codigo: e.codigo,
      marca: e.marca ?? "",
      descricao: e.descricao,
      unidade: e.unidade,
      custo_planejado: e.custo_planejado ?? "",
      ultimo_custo: e.ultimo_custo ?? "",
    });
    setModal(true);
  }

  async function salvar() {
    if (!form.codigo || !form.descricao || !form.categoria_id) return;
    const payload = {
      categoria_id: Number(form.categoria_id),
      codigo: form.codigo,
      marca: form.marca || undefined,
      descricao: form.descricao,
      unidade: form.unidade,
      custo_planejado: form.custo_planejado || undefined,
      ultimo_custo: form.ultimo_custo || undefined,
    };
    if (editando) {
      await atualizar.mutateAsync({ id: editando.id, ...payload });
    } else {
      await criar.mutateAsync(payload);
    }
    setModal(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Especificações</h1>
        <Button onClick={abrirNova}>
          <Plus className="h-4 w-4" /> Nova especificação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar código, descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select onValueChange={(v) => setCatFiltro(v === "todos" ? undefined : Number(v))}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{especificacoes.length} item(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {especificacoes.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{e.codigo}</span>
                    <Badge variant="secondary">{e.categoria.nome}</Badge>
                    {e.marca && <span className="text-xs text-muted-foreground">{e.marca}</span>}
                  </div>
                  <p className="text-sm mt-1 truncate">{e.descricao}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  {e.custo_planejado && <div>Plan.: {formatarMoeda(e.custo_planejado)}</div>}
                  {e.ultimo_custo && <div>Últ.: {formatarMoeda(e.ultimo_custo)}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => abrirEditar(e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    if (confirm("Remover especificação?")) await remover.mutateAsync(e.id);
                  }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {especificacoes.length === 0 && (
              <p className="py-8 text-center text-muted-foreground text-sm">Nenhuma especificação encontrada.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar especificação" : "Nova especificação"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Categoria *</Label>
              <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Código *</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="mmic01" />
            </div>
            <div className="space-y-1">
              <Label>Marca</Label>
              <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="microsoft" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Descrição / Nome técnico *</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Mouse Microsoft USB óptico" />
            </div>
            <div className="space-y-1">
              <Label>Custo planejado (R$)</Label>
              <Input type="number" step="0.01" value={form.custo_planejado} onChange={(e) => setForm({ ...form, custo_planejado: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Último custo (R$)</Label>
              <Input type="number" step="0.01" value={form.ultimo_custo} onChange={(e) => setForm({ ...form, ultimo_custo: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={criar.isPending || atualizar.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
