import { useMemo, useState } from "react";
import { useFornecedores, useCriarFornecedor, useAtualizarFornecedor, useRemoverFornecedor, baixarModeloXlsx } from "@/hooks/useFornecedores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Fornecedor } from "@/lib/types";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FileSpreadsheet, MessageCircle, Clock, Layers } from "lucide-react";

const SEGMENTOS_SUGERIDOS = ["TI", "Construção", "Alimentos", "Móveis", "Eletrodomésticos"];

const FORM_VAZIO = { nome: "", segmento: "", contato: "", whatsapp: "", lead_time_dias: "" };

function formatarWhatsapp(w: string) {
  // remove tudo que não for dígito
  return w.replace(/\D/g, "");
}

export default function FornecedoresPage() {
  const { data: fornecedores = [] } = useFornecedores(false);
  const criar = useCriarFornecedor();
  const atualizar = useAtualizarFornecedor();
  const remover = useRemoverFornecedor();

  // Modal de novo segmento
  const [modalSegmento, setModalSegmento] = useState(false);
  const [novoSegmento, setNovoSegmento] = useState("");

  // Modal de fornecedor
  const [modalFornecedor, setModalFornecedor] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);

  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  const grupos = useMemo(() => {
    const mapa: Record<string, Fornecedor[]> = {};
    for (const f of fornecedores) {
      const seg = f.segmento ?? "Sem segmento";
      if (!mapa[seg]) mapa[seg] = [];
      mapa[seg].push(f);
    }
    return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b));
  }, [fornecedores]);

  function toggleGrupo(seg: string) {
    setExpandidos((prev) => ({ ...prev, [seg]: prev[seg] === false ? true : false }));
  }
  function isExpandido(seg: string) {
    return expandidos[seg] !== false;
  }

  // Abre modal de novo segmento
  function abrirNovoSegmento() {
    setNovoSegmento("");
    setModalSegmento(true);
  }

  // Confirma segmento e abre modal de fornecedor pré-preenchido
  function confirmarSegmento() {
    if (!novoSegmento.trim()) return;
    setModalSegmento(false);
    setEditando(null);
    setForm({ ...FORM_VAZIO, segmento: novoSegmento.trim() });
    setModalFornecedor(true);
  }

  // Abre modal de fornecedor dentro de um segmento existente
  function abrirNovoFornecedor(segmento: string) {
    setEditando(null);
    setForm({ ...FORM_VAZIO, segmento });
    setModalFornecedor(true);
  }

  function abrirEditar(f: Fornecedor) {
    setEditando(f);
    setForm({
      nome: f.nome,
      segmento: f.segmento ?? "",
      contato: f.contato ?? "",
      whatsapp: f.whatsapp ?? "",
      lead_time_dias: f.lead_time_dias != null ? String(f.lead_time_dias) : "",
    });
    setModalFornecedor(true);
  }

  async function salvar() {
    if (!form.nome.trim()) return;
    const payload = {
      nome: form.nome,
      segmento: form.segmento || null,
      contato: form.contato || null,
      whatsapp: form.whatsapp ? formatarWhatsapp(form.whatsapp) : null,
      lead_time_dias: form.lead_time_dias ? Number(form.lead_time_dias) : null,
    };
    if (editando) {
      await atualizar.mutateAsync({ id: editando.id, ...payload });
    } else {
      await criar.mutateAsync(payload);
    }
    setModalFornecedor(false);
  }

  async function confirmarRemover(id: number) {
    if (confirm("Remover fornecedor?")) await remover.mutateAsync(id);
  }

  function abrirWhatsapp(numero: string) {
    const limpo = formatarWhatsapp(numero);
    window.open(`https://wa.me/55${limpo}`, "_blank");
  }

  async function excluirSegmento(segmento: string, lista: Fornecedor[]) {
    if (!confirm(`Excluir o segmento "${segmento}" e todos os ${lista.length} fornecedor(es)?`)) return;
    for (const f of lista) {
      await remover.mutateAsync(f.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        <Button onClick={abrirNovoSegmento}>
          <Layers className="h-4 w-4" /> Novo segmento
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{fornecedores.length} fornecedor(es) cadastrado(s)</p>

      {fornecedores.length === 0 && (
        <p className="py-12 text-center text-muted-foreground text-sm">Nenhum fornecedor cadastrado.</p>
      )}

      <div className="space-y-3">
        {grupos.map(([segmento, lista]) => (
          <div key={segmento} className="border rounded-lg overflow-hidden">
            {/* Cabeçalho do grupo */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
              <button className="flex items-center gap-2 flex-1 text-left" onClick={() => toggleGrupo(segmento)}>
                {isExpandido(segmento)
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <span className="font-semibold text-sm">{segmento}</span>
                <Badge variant="secondary" className="text-xs">{lista.length}</Badge>
              </button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="sm"
                  className="text-xs text-muted-foreground gap-1 h-7"
                  onClick={() => baixarModeloXlsx(segmento)}
                  title="Baixar planilha modelo"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Planilha modelo
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="text-xs gap-1 h-7"
                  onClick={() => abrirNovoFornecedor(segmento)}
                >
                  <Plus className="h-3.5 w-3.5" /> Fornecedor
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 h-7"
                  onClick={() => excluirSegmento(segmento, lista)}
                  title="Excluir segmento e todos os fornecedores"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Lista de fornecedores */}
            {isExpandido(segmento) && (
              <div className="divide-y">
                {lista.map((f) => {
                  const leadTime = f.lead_time_calculado ?? f.lead_time_dias;
                  return (
                    <div key={f.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{f.nome}</p>
                          <Badge variant={f.ativo ? "success" : "secondary"} className="text-xs">
                            {f.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          {leadTime != null && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {leadTime} dias
                              {f.lead_time_calculado != null && (
                                <span className="text-blue-500 text-[10px]">(real)</span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {f.contato && (
                            <span className="text-xs text-muted-foreground truncate">{f.contato}</span>
                          )}
                          {f.whatsapp && (
                            <button
                              onClick={() => abrirWhatsapp(f.whatsapp!)}
                              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                            >
                              <MessageCircle className="h-3 w-3" />
                              {f.whatsapp}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditar(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmarRemover(f.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Novo Segmento */}
      <Dialog open={modalSegmento} onOpenChange={setModalSegmento}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo segmento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome do segmento *</Label>
            <Input
              list="segmentos-list"
              value={novoSegmento}
              onChange={(e) => setNovoSegmento(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarSegmento()}
              placeholder="Ex: TI, Construção, Alimentos..."
              autoFocus
            />
            <datalist id="segmentos-list">
              {SEGMENTOS_SUGERIDOS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalSegmento(false)}>Cancelar</Button>
            <Button onClick={confirmarSegmento} disabled={!novoSegmento.trim()}>
              Próximo: adicionar fornecedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Fornecedor */}
      <Dialog open={modalFornecedor} onOpenChange={setModalFornecedor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar fornecedor" : `Novo fornecedor — ${form.segmento || "Sem segmento"}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
            </div>
            <div className="space-y-1">
              <Label>Segmento</Label>
              <Input
                list="segmentos-form-list"
                value={form.segmento}
                onChange={(e) => setForm({ ...form, segmento: e.target.value })}
              />
              <datalist id="segmentos-form-list">
                {SEGMENTOS_SUGERIDOS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>E-mail / Contato</Label>
                <Input value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalFornecedor(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={criar.isPending || atualizar.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
