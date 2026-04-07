import { useState } from "react";
import { useKanban, useAtualizarStatusPedido } from "@/hooks/usePedidos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarMoeda, formatarData } from "@/lib/utils";
// Label e Input ainda usados no dialog de emissão
import type { PedidoKanban, StatusPedido } from "@/lib/types";
import { AlertTriangle, Clock, ArrowRight, Timer } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Parseia uma string de data/datetime.
 * Strings date-only ("2026-04-07") são tratadas como meia-noite LOCAL
 * para evitar o offset UTC que o JavaScript aplica por padrão.
 */
function parseTs(s: string): number {
  return new Date(s.includes("T") ? s : s + "T00:00:00").getTime();
}

/** Formata a duração entre dois timestamps (ou entre `desde` e agora).
 *  Quando `ate` é date-only e `desde` tem horário, compara só as datas
 *  para evitar offset negativo intra-dia. */
function formatarDuracao(desde: string, ate?: string | null): string {
  const ateEhSoData = ate && !ate.includes("T");

  if (ateEhSoData) {
    // Conta dias corridos entre a data de criação e a data de emissão
    const diaDesde = desde.slice(0, 10); // "YYYY-MM-DD"
    const dias = Math.round(
      (parseTs(ate!) - parseTs(diaDesde)) / 86_400_000
    );
    if (dias <= 0) return "< 1 dia";
    return `${dias}d`;
  }

  const ms = (ate ? parseTs(ate) : Date.now()) - parseTs(desde);
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}min`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

/** Duração em dias fracionados para decidir cor de alerta */
function duracaoDias(desde: string, ate?: string | null): number {
  const ateEhSoData = ate && !ate.includes("T");
  if (ateEhSoData) {
    return Math.round((parseTs(ate!) - parseTs(desde.slice(0, 10))) / 86_400_000);
  }
  const ms = (ate ? parseTs(ate) : Date.now()) - parseTs(desde);
  return ms / 86_400_000;
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function ChipSLA({ valor, label, cor }: { valor: string; label: string; cor: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cor}`}>
      <Timer className="h-3 w-3" />
      {label}: {valor}
    </span>
  );
}

// ── Tipos de dialog ────────────────────────────────────────────────────────────

type DialogState =
  | { tipo: "emitir"; pedido: PedidoKanban }
  | { tipo: "receber"; pedido: PedidoKanban }
  | null;

// ── Card de pedido ─────────────────────────────────────────────────────────────

function CardPedido({
  pedido,
  coluna,
  onAvancar,
}: {
  pedido: PedidoKanban;
  coluna: "cotando" | "pedido_emitido" | "recebido";
  onAvancar: (p: PedidoKanban) => void;
}) {
  // Tempo de resposta: criado_em → data_pedido (ou agora se ainda cotando)
  const fimResposta = pedido.data_pedido ?? null;
  const tempoResposta = pedido.criado_em
    ? formatarDuracao(pedido.criado_em, fimResposta)
    : null;
  const diasResposta = pedido.criado_em ? duracaoDias(pedido.criado_em, fimResposta) : 0;

  // Tempo de entrega: data_pedido → data_recebimento (ou agora se em trânsito)
  const fimEntrega = pedido.data_recebimento ?? null;
  const tempoEntrega = pedido.data_pedido
    ? formatarDuracao(pedido.data_pedido, fimEntrega)
    : null;
  const diasEntrega = pedido.data_pedido ? duracaoDias(pedido.data_pedido, fimEntrega) : 0;

  return (
    <div
      className={`
        rounded-lg border bg-white p-3 shadow-sm space-y-2
        ${pedido.prazo_vencido ? "border-destructive" : ""}
        ${pedido.prazo_proximo && !pedido.prazo_vencido ? "border-yellow-400" : ""}
      `}
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          {pedido.especificacao_codigo}
        </span>
        <div className="flex items-center gap-1">
          {pedido.prazo_vencido && <AlertTriangle className="h-4 w-4 text-destructive" />}
          {pedido.prazo_proximo && !pedido.prazo_vencido && (
            <Clock className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Descrição e fornecedor */}
      <p className="text-sm font-medium leading-tight line-clamp-2">
        {pedido.especificacao_descricao}
      </p>
      <p className="text-xs text-muted-foreground">{pedido.fornecedor_nome}</p>

      {/* Valor e prazo */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">
          {formatarMoeda(Number(pedido.preco_cotado) * Number(pedido.quantidade))}
        </span>
        {pedido.prazo_fornecedor && (
          <span
            className={`text-xs ${
              pedido.prazo_vencido
                ? "text-destructive font-medium"
                : pedido.prazo_proximo
                ? "text-yellow-600 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {formatarData(pedido.prazo_fornecedor)}
          </span>
        )}
      </div>

      {/* SLA chips */}
      <div className="flex flex-wrap gap-1">
        {coluna === "cotando" && tempoResposta && (
          <ChipSLA
            valor={tempoResposta}
            label="Aguardando"
            cor={diasResposta > 3 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}
          />
        )}
        {coluna === "pedido_emitido" && tempoResposta && pedido.data_pedido && (
          <ChipSLA
            valor={tempoResposta}
            label="Resposta"
            cor="bg-blue-50 text-blue-700"
          />
        )}
        {coluna === "pedido_emitido" && tempoEntrega && (
          <ChipSLA
            valor={tempoEntrega}
            label="Em trânsito"
            cor={diasEntrega > 7 ? "bg-orange-100 text-orange-700" : "bg-yellow-50 text-yellow-700"}
          />
        )}
        {coluna === "recebido" && tempoResposta && pedido.data_pedido && (
          <ChipSLA valor={tempoResposta} label="Resposta" cor="bg-slate-100 text-slate-500" />
        )}
        {coluna === "recebido" && tempoEntrega && pedido.data_recebimento && (
          <ChipSLA valor={tempoEntrega} label="Entrega" cor="bg-green-50 text-green-700" />
        )}
      </div>

      {/* Botão avançar */}
      {coluna !== "recebido" && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={() => onAvancar(pedido)}
        >
          Avançar <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}

// ── Coluna ─────────────────────────────────────────────────────────────────────

const COLUNAS: { key: "cotando" | "pedido_emitido" | "recebido"; label: string; cor: string }[] = [
  { key: "cotando",        label: "Cotando",        cor: "bg-slate-100" },
  { key: "pedido_emitido", label: "Pedido Emitido", cor: "bg-yellow-50" },
  { key: "recebido",       label: "Recebido",       cor: "bg-green-50" },
];

function ColunaKanban({
  coluna,
  pedidos,
  onAvancar,
}: {
  coluna: (typeof COLUNAS)[number];
  pedidos: PedidoKanban[];
  onAvancar: (p: PedidoKanban) => void;
}) {
  return (
    <div className="flex flex-col min-w-[240px] flex-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{coluna.label}</h3>
        <Badge variant="secondary">{pedidos.length}</Badge>
      </div>
      <div className={`flex-1 rounded-lg p-2 space-y-2 min-h-[120px] ${coluna.cor}`}>
        {pedidos.map((p) => (
          <CardPedido
            key={p.id}
            pedido={p}
            coluna={coluna.key}
            onAvancar={onAvancar}
          />
        ))}
        {pedidos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-4">Vazio</p>
        )}
      </div>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function KanbanPage() {
  const { data: board, isLoading } = useKanban();
  const atualizar = useAtualizarStatusPedido();
  const [dialog, setDialog] = useState<DialogState>(null);

  const [dataEmissao, setDataEmissao] = useState(hoje());

  function handleAvancar(pedido: PedidoKanban) {
    if (pedido.status === "cotando" || pedido.status === "aprovado") {
      setDataEmissao(hoje());
      setDialog({ tipo: "emitir", pedido });
    } else if (pedido.status === "pedido_emitido" || pedido.status === "em_transito") {
      setDialog({ tipo: "receber", pedido });
    }
  }

  function confirmarEmissao() {
    if (!dialog || dialog.tipo !== "emitir") return;
    atualizar.mutate({
      id: dialog.pedido.id,
      status: "pedido_emitido",
      data_pedido: dataEmissao,
    });
    setDialog(null);
  }

  function confirmarRecebimento() {
    if (!dialog || dialog.tipo !== "receber") return;
    // usa preco_cotado como custo_comprado para calcular saving automaticamente
    atualizar.mutate({
      id: dialog.pedido.id,
      status: "recebido",
      custo_comprado: Number(dialog.pedido.preco_cotado),
    });
    setDialog(null);
  }

  if (isLoading) return <p className="text-muted-foreground">Carregando kanban...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pedidos — Kanban</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUNAS.map((col) => (
          <ColunaKanban
            key={col.key}
            coluna={col}
            pedidos={(board as Record<string, PedidoKanban[]>)?.[col.key] ?? []}
            onAvancar={handleAvancar}
          />
        ))}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-destructive" /> Prazo vencido
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-yellow-500" /> Prazo próximo (≤3 dias)
        </span>
        <span className="flex items-center gap-1">
          <Timer className="h-3 w-3" /> Tempo SLA em dias
        </span>
      </div>

      {/* Dialog: confirmar emissão de pedido */}
      <Dialog open={dialog?.tipo === "emitir"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Emissão de Pedido</DialogTitle>
          </DialogHeader>
          {dialog?.tipo === "emitir" && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">
                  {dialog.pedido.especificacao_codigo}
                </span>{" "}
                — {dialog.pedido.especificacao_descricao}
              </p>
              <p className="text-sm">Fornecedor: <strong>{dialog.pedido.fornecedor_nome}</strong></p>
              <div className="space-y-1">
                <Label htmlFor="dataEmissao">Data de emissão</Label>
                <Input
                  id="dataEmissao"
                  type="date"
                  value={dataEmissao}
                  onChange={(e) => setDataEmissao(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={confirmarEmissao} disabled={atualizar.isPending}>
              Confirmar Emissão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: confirmar recebimento */}
      <Dialog open={dialog?.tipo === "receber"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
          </DialogHeader>
          {dialog?.tipo === "receber" && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">
                  {dialog.pedido.especificacao_codigo}
                </span>{" "}
                — {dialog.pedido.especificacao_descricao}
              </p>
              <p className="text-sm">Fornecedor: <strong>{dialog.pedido.fornecedor_nome}</strong></p>
              <p className="text-sm">
                Quantidade: <strong>{Number(dialog.pedido.quantidade)} un</strong>
              </p>
              <p className="text-sm">
                Valor do pedido:{" "}
                <strong>
                  {formatarMoeda(Number(dialog.pedido.preco_cotado) * Number(dialog.pedido.quantidade))}
                </strong>
              </p>
              <p className="text-xs text-muted-foreground">
                O saving será calculado automaticamente com base no preço cotado.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={confirmarRecebimento} disabled={atualizar.isPending}>
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
