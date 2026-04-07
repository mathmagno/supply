import { useState, useMemo } from "react";
import { useSessoesCotacao, useCotacaoComparativa, useRemoverSessao } from "@/hooks/useCotacoes";
import { useCriarPedido } from "@/hooks/usePedidos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatarMoeda } from "@/lib/utils";
import type { CotacaoComparativa, PrecoFornecedor } from "@/lib/types";
import { ShoppingCart, Trophy, Trash2 } from "lucide-react";

interface ItemCalculadora {
  especificacaoId: number;
  fornecedorId: number;
  fornecedorNome: string;
  preco: number;
  quantidade: number;
}

export default function CotacaoPage() {
  const { data: sessoes = [] } = useSessoesCotacao();
  const [sessaoId, setSessaoId] = useState<number | undefined>();
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<Record<number, ItemCalculadora>>({});
  const removerSessao = useRemoverSessao();

  const { data: comparativas = [], isLoading } = useCotacaoComparativa(sessaoId);
  const criarPedido = useCriarPedido();

  const itensFiltrados = useMemo(() => {
    if (!busca) return comparativas;
    const t = busca.toLowerCase();
    return comparativas.filter(
      (c) =>
        c.especificacao.codigo.toLowerCase().includes(t) ||
        c.especificacao.descricao.toLowerCase().includes(t)
    );
  }, [comparativas, busca]);

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

  const totalGeral = Object.values(carrinho).reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  async function gerarPedidos() {
    for (const item of Object.values(carrinho)) {
      const comp = comparativas.find((c) => c.especificacao.id === item.especificacaoId);
      await criarPedido.mutateAsync({
        especificacao_id: item.especificacaoId,
        fornecedor_id: item.fornecedorId,
        quantidade: item.quantidade,
        preco_cotado: item.preco,
        custo_planejado: comp?.especificacao.custo_planejado
          ? Number(comp.especificacao.custo_planejado)
          : undefined,
      });
    }
    setCarrinho({});
    alert(`${Object.keys(carrinho).length} pedido(s) criado(s) com sucesso!`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cotação Comparativa</h1>
        {Object.keys(carrinho).length > 0 && (
          <Button onClick={gerarPedidos} disabled={criarPedido.isPending}>
            <ShoppingCart className="h-4 w-4" />
            Gerar {Object.keys(carrinho).length} Pedido(s) — {formatarMoeda(totalGeral)}
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex gap-1">
          <Select onValueChange={(v) => setSessaoId(Number(v))}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Selecione a sessão de cotação" />
            </SelectTrigger>
            <SelectContent>
              {sessoes.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.data_cotacao} {s.descricao ? `— ${s.descricao}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sessaoId && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={removerSessao.isPending}
              onClick={() => {
                if (confirm("Excluir esta importação e todos os preços vinculados?")) {
                  removerSessao.mutate(sessaoId, {
                    onSuccess: () => setSessaoId(undefined),
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Input
          placeholder="Buscar por código ou descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Calculadora resumo */}
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

      {/* Tabela comparativa */}
      {isLoading && <p className="text-muted-foreground">Carregando cotações...</p>}

      {!isLoading && sessaoId && itensFiltrados.length === 0 && (
        <p className="text-muted-foreground">Nenhum item encontrado.</p>
      )}

      <div className="space-y-4">
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
                        <span className="text-xs text-muted-foreground">
                          {comp.especificacao.marca}
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
                    const estaSelecionado =
                      selecionado?.fornecedorId === pf.fornecedor_id;
                    return (
                      <button
                        key={pf.fornecedor_id}
                        onClick={() => selecionarFornecedor(comp, pf)}
                        className={`
                          flex flex-col items-center rounded-lg border px-4 py-2 text-sm transition-all
                          ${estaSelecionado ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}
                          ${pf.menor_preco ? "bg-green-50 border-green-300" : ""}
                        `}
                      >
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                          {pf.menor_preco && <Trophy className="h-3 w-3 text-green-600" />}
                          {pf.fornecedor_nome}
                        </span>
                        <span className={`font-bold ${pf.menor_preco ? "text-green-700" : ""}`}>
                          {formatarMoeda(pf.preco)}
                        </span>
                        {pf.menor_preco && (
                          <Badge variant="success" className="mt-1 text-xs">Menor preço</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selecionado && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Qtd:</span>
                    <Input
                      type="number"
                      min={1}
                      value={selecionado.quantidade}
                      onChange={(e) =>
                        alterarQtd(comp.especificacao.id, Number(e.target.value))
                      }
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
    </div>
  );
}
