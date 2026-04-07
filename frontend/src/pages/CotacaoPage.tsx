import { useState, useMemo } from "react";
import { useSessoesCotacao, useCotacaoComparativa, useRemoverSessao } from "@/hooks/useCotacoes";
import { useCriarPedido } from "@/hooks/usePedidos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatarMoeda } from "@/lib/utils";
import type { CotacaoComparativa, PrecoFornecedor, SessaoCotacao } from "@/lib/types";
import { ShoppingCart, Trophy, Trash2, Package, Truck, CalendarDays, X, Clock, CheckCircle2, ArrowUpDown } from "lucide-react";

type CriterioOrdem = "preco" | "lead_time" | "pontualidade";

// ── Chips de métricas ─────────────────────────────────────────────────────────
function ChipLeadTime({ dias }: { dias: number | null }) {
  if (dias === null) return <span className="text-[10px] text-muted-foreground">⏱ sem histórico</span>;
  const cor = dias <= 7 ? "text-green-600" : dias <= 14 ? "text-yellow-600" : "text-red-600";
  return <span className={`text-[10px] font-medium flex items-center gap-0.5 ${cor}`}><Clock className="h-2.5 w-2.5" />{dias} dias</span>;
}

function ChipPontualidade({ taxa }: { taxa: number | null }) {
  if (taxa === null) return <span className="text-[10px] text-muted-foreground">📦 sem histórico</span>;
  const pct = Math.round(taxa * 100);
  const cor = pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600";
  return <span className={`text-[10px] font-medium ${cor}`}>📦 {pct}% pontual</span>;
}

function ChipPedidos({ total }: { total: number }) {
  if (total === 0) return <span className="text-[10px] text-muted-foreground italic">Novo fornecedor</span>;
  return <span className="text-[10px] text-muted-foreground">✓ {total} pedido{total !== 1 ? "s" : ""}</span>;
}

// Determina o "líder" de cada fornecedor num critério
function calcularLider(precos: PrecoFornecedor[], criterio: CriterioOrdem): number | null {
  const validos = precos.filter((p) => {
    if (criterio === "preco") return true;
    if (criterio === "lead_time") return p.lead_time_medio !== null;
    if (criterio === "pontualidade") return p.taxa_pontualidade !== null;
    return false;
  });
  if (!validos.length) return null;
  if (criterio === "preco") return validos.reduce((a, b) => Number(a.preco) < Number(b.preco) ? a : b).fornecedor_id;
  if (criterio === "lead_time") return validos.reduce((a, b) => (a.lead_time_medio! < b.lead_time_medio! ? a : b)).fornecedor_id;
  if (criterio === "pontualidade") return validos.reduce((a, b) => (a.taxa_pontualidade! > b.taxa_pontualidade! ? a : b)).fornecedor_id;
  return null;
}

interface ItemCalculadora {
  especificacaoId: number;
  fornecedorId: number;
  fornecedorNome: string;
  preco: number;
  quantidade: number;
}

const STATUS_KANBAN_CONFIG: Record<string, { label: string; classe: string }> = {
  recebido:       { label: "Recebido",       classe: "bg-green-100 text-green-800 border-green-300" },
  parcial:        { label: "Parcial",        classe: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  em_transito:    { label: "Em trânsito",    classe: "bg-blue-100 text-blue-800 border-blue-300" },
  pedido_emitido: { label: "Pedido emitido", classe: "bg-orange-100 text-orange-800 border-orange-300" },
  aprovado:       { label: "Aprovado",       classe: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  cotando:        { label: "Em cotação",     classe: "bg-gray-100 text-gray-700 border-gray-300" },
};

function StatusSessao({ s }: { s: SessaoCotacao }) {
  if (s.status_kanban && STATUS_KANBAN_CONFIG[s.status_kanban]) {
    const { label, classe } = STATUS_KANBAN_CONFIG[s.status_kanban];
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${classe}`}>
        {label}
      </span>
    );
  }
  if (s.total_produtos > 0) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-300">
        Aguardando pedido
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-white text-gray-400 border-gray-200">
      Vazia
    </span>
  );
}

function formatarData(d: string) {
  const [y, m, dia] = d.split("-");
  return `${dia}/${m}/${y}`;
}

function diasAtras(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  return `há ${diff} dias`;
}

export default function CotacaoPage() {
  const { data: sessoes = [] } = useSessoesCotacao();
  const [sessaoId, setSessaoId] = useState<number | undefined>();
  const [carrinho, setCarrinho] = useState<Record<number, ItemCalculadora>>({});
  const removerSessao = useRemoverSessao();

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtraMarca, setFiltraMarca] = useState("todas");
  const [filtraFornecedor, setFiltraFornecedor] = useState("todos");
  const [filtraStatus, setFiltraStatus] = useState("todas");
  const [criterioOrdem, setCriterioOrdem] = useState<CriterioOrdem>("preco");

  const { data: comparativas = [], isLoading } = useCotacaoComparativa(sessaoId);
  const criarPedido = useCriarPedido();

  // Opções de filtro derivadas dos dados
  const marcas = useMemo(() => {
    const s = new Set(comparativas.map((c) => c.especificacao.marca).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [comparativas]);

  const fornecedores = useMemo(() => {
    const s = new Set(comparativas.flatMap((c) => c.precos.map((p) => p.fornecedor_nome)));
    return Array.from(s).sort();
  }, [comparativas]);

  // Itens filtrados
  const itensFiltrados = useMemo(() => {
    let lista = comparativas;

    if (busca) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.especificacao.codigo.toLowerCase().includes(t) ||
          c.especificacao.descricao.toLowerCase().includes(t)
      );
    }
    if (filtraMarca !== "todas") {
      lista = lista.filter((c) => c.especificacao.marca === filtraMarca);
    }
    if (filtraFornecedor !== "todos") {
      lista = lista.filter((c) => c.precos.some((p) => p.fornecedor_nome === filtraFornecedor));
    }
    if (filtraStatus === "menor") {
      lista = lista.filter((c) => c.precos.some((p) => p.menor_preco));
    }
    if (filtraStatus === "selecionado") {
      lista = lista.filter((c) => !!carrinho[c.especificacao.id]);
    }

    return lista;
  }, [comparativas, busca, filtraMarca, filtraFornecedor, filtraStatus, carrinho]);

  const filtrosAtivos = [busca, filtraMarca !== "todas", filtraFornecedor !== "todos", filtraStatus !== "todas"].filter(Boolean).length;

  function limparFiltros() {
    setBusca("");
    setFiltraMarca("todas");
    setFiltraFornecedor("todos");
    setFiltraStatus("todas");
  }

  function selecionarFornecedor(comp: CotacaoComparativa, pf: PrecoFornecedor) {
    setCarrinho((prev) => ({
      ...prev,
      [comp.especificacao.id]: {
        especificacaoId: comp.especificacao.id,
        fornecedorId: pf.fornecedor_id,
        fornecedorNome: pf.fornecedor_nome,
        preco: Number(pf.preco),
        quantidade: prev[comp.especificacao.id]?.quantidade ?? 1,
      },
    }));
  }

  function alterarQtd(specId: number, qtd: number) {
    setCarrinho((prev) =>
      prev[specId] ? { ...prev, [specId]: { ...prev[specId], quantidade: qtd } } : prev
    );
  }

  const totalPorFornecedor = useMemo(() => {
    const totais: Record<string, number> = {};
    Object.values(carrinho).forEach((item) => {
      totais[item.fornecedorNome] = (totais[item.fornecedorNome] ?? 0) + item.preco * item.quantidade;
    });
    return totais;
  }, [carrinho]);

  const totalGeral = Object.values(carrinho).reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  async function gerarPedidos() {
    for (const item of Object.values(carrinho)) {
      const comp = comparativas.find((c) => c.especificacao.id === item.especificacaoId);
      await criarPedido.mutateAsync({
        especificacao_id: item.especificacaoId,
        fornecedor_id: item.fornecedorId,
        quantidade: item.quantidade,
        preco_cotado: item.preco,
        custo_planejado: comp?.especificacao.custo_planejado ? Number(comp.especificacao.custo_planejado) : undefined,
      });
    }
    setCarrinho({});
    alert(`${Object.keys(carrinho).length} pedido(s) criado(s) com sucesso!`);
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cotação Comparativa</h1>
        {Object.keys(carrinho).length > 0 && (
          <Button onClick={gerarPedidos} disabled={criarPedido.isPending}>
            <ShoppingCart className="h-4 w-4" />
            Gerar {Object.keys(carrinho).length} pedido(s) — {formatarMoeda(totalGeral)}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-4 items-start">
        {/* ── Painel de sessões ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Importações ({sessoes.length})
          </p>
          <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
            {sessoes.map((s) => {
              const ativa = s.id === sessaoId;
              return (
                <div
                  key={s.id}
                  onClick={() => { setSessaoId(s.id); setCarrinho({}); }}
                  className={`
                    relative rounded-lg border p-3 cursor-pointer transition-all group
                    ${ativa ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40 hover:bg-muted/50"}
                  `}
                >
                  {/* Data + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-sm">{formatarData(s.data_cotacao)}</span>
                    </div>
                    <StatusSessao s={s} />
                  </div>

                  {/* Nome do arquivo */}
                  {s.arquivo_origem && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{s.arquivo_origem}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" /> {s.total_produtos} produtos
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Truck className="h-3 w-3" /> {s.total_fornecedores} fornec.
                    </span>
                  </div>

                  {/* Tempo */}
                  <p className="text-[10px] text-muted-foreground mt-1">{diasAtras(s.data_cotacao)}</p>

                  {/* Botão delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Excluir esta importação e todos os preços vinculados?")) {
                        removerSessao.mutate(s.id, {
                          onSuccess: () => { if (ativa) setSessaoId(undefined); },
                        });
                      }
                    }}
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {sessoes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma importação encontrada.
              </p>
            )}
          </div>
        </div>

        {/* ── Conteúdo principal ── */}
        <div className="space-y-4 min-w-0">
          {!sessaoId ? (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-sm">Selecione uma importação para ver a cotação</p>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-48">
                  <Input
                    placeholder="Buscar por código ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>

                <Select value={filtraMarca} onValueChange={setFiltraMarca}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as marcas</SelectItem>
                    {marcas.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filtraFornecedor} onValueChange={setFiltraFornecedor}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos fornecedores</SelectItem>
                    {fornecedores.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filtraStatus} onValueChange={setFiltraStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todos os itens</SelectItem>
                    <SelectItem value="menor">Menor preço identificado</SelectItem>
                    <SelectItem value="selecionado">Itens selecionados</SelectItem>
                  </SelectContent>
                </Select>

                {filtrosAtivos > 0 && (
                  <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-1 text-muted-foreground">
                    <X className="h-3.5 w-3.5" /> Limpar ({filtrosAtivos})
                  </Button>
                )}

                {/* Toggle de ordenação */}
                <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5 bg-muted/50">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
                  {(["preco", "lead_time", "pontualidade"] as CriterioOrdem[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCriterioOrdem(c)}
                      className={`text-xs px-2.5 py-1 rounded transition-all ${
                        criterioOrdem === c
                          ? "bg-white shadow-sm font-semibold text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c === "preco" ? "Preço" : c === "lead_time" ? "Lead time" : "Pontualidade"}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-muted-foreground">
                  {itensFiltrados.length} de {comparativas.length} itens
                </span>
              </div>

              {/* Resumo da seleção */}
              {Object.keys(totalPorFornecedor).length > 0 && (
                <Card className="border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resumo da Seleção</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(totalPorFornecedor).map(([forn, total]) => (
                        <div key={forn} className="text-sm">
                          <span className="text-muted-foreground">{forn}:</span>{" "}
                          <span className="font-semibold">{formatarMoeda(total)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista comparativa */}
              {isLoading && <p className="text-muted-foreground text-sm">Carregando cotações...</p>}
              {!isLoading && itensFiltrados.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhum item encontrado com os filtros aplicados.</p>
              )}

              <div className="space-y-3">
                {itensFiltrados.map((comp) => {
                  const selecionado = carrinho[comp.especificacao.id];
                  return (
                    <Card key={comp.especificacao.id} className={selecionado ? "border-primary/50" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                {comp.especificacao.codigo}
                              </span>
                              {comp.especificacao.marca && (
                                <span className="text-xs text-muted-foreground">{comp.especificacao.marca}</span>
                              )}
                              {comp.status_pedido && STATUS_KANBAN_CONFIG[comp.status_pedido] && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_KANBAN_CONFIG[comp.status_pedido].classe}`}>
                                  {STATUS_KANBAN_CONFIG[comp.status_pedido].label}
                                </span>
                              )}
                            </div>
                            <p className="font-medium mt-1">{comp.especificacao.descricao}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground space-y-1">
                            {comp.especificacao.custo_planejado && (
                              <div>Planejado: {formatarMoeda(comp.especificacao.custo_planejado)}</div>
                            )}
                            {comp.especificacao.ultimo_custo && (
                              <div>Último: {formatarMoeda(comp.especificacao.ultimo_custo)}</div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {comp.precos.map((pf) => {
                            const estaSelecionado = selecionado?.fornecedorId === pf.fornecedor_id;
                            const liderId = calcularLider(comp.precos, criterioOrdem);
                            const eLider = pf.fornecedor_id === liderId;
                            const labelLider = criterioOrdem === "preco" ? "Menor preço" : criterioOrdem === "lead_time" ? "Mais rápido" : "Mais pontual";
                            return (
                              <button
                                key={pf.fornecedor_id}
                                onClick={() => selecionarFornecedor(comp, pf)}
                                className={`
                                  flex flex-col items-start rounded-lg border px-3 py-2 text-sm transition-all min-w-[110px]
                                  ${estaSelecionado ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}
                                  ${eLider && !estaSelecionado ? "bg-green-50 border-green-300" : ""}
                                `}
                              >
                                <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium w-full">
                                  {eLider && <Trophy className="h-3 w-3 text-green-600 shrink-0" />}
                                  <span className="truncate">{pf.fornecedor_nome}</span>
                                </span>
                                <span className={`font-bold text-base ${eLider ? "text-green-700" : ""}`}>
                                  {formatarMoeda(pf.preco)}
                                </span>
                                {eLider && (
                                  <Badge variant="success" className="mt-0.5 text-[10px] px-1.5">{labelLider}</Badge>
                                )}
                                {/* Métricas */}
                                <div className="flex flex-col gap-0.5 mt-1.5 border-t pt-1.5 w-full">
                                  <ChipLeadTime dias={pf.lead_time_medio} />
                                  <ChipPontualidade taxa={pf.taxa_pontualidade} />
                                  <ChipPedidos total={pf.total_pedidos_recebidos} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {selecionado && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Qtd:</span>
                            <Input
                              type="number" min={1}
                              value={selecionado.quantidade}
                              onChange={(e) => alterarQtd(comp.especificacao.id, Number(e.target.value))}
                              className="w-20 h-7 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              Total: {formatarMoeda(selecionado.preco * selecionado.quantidade)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
