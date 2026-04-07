import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useKanban, useAtualizarStatusPedido } from "@/hooks/usePedidos";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda, formatarData } from "@/lib/utils";
import type { PedidoKanban, StatusPedido } from "@/lib/types";
import { AlertTriangle, Clock } from "lucide-react";

const COLUNAS: { key: StatusPedido; label: string; cor: string }[] = [
  { key: "cotando",        label: "Cotando",        cor: "bg-slate-100" },
  { key: "aprovado",       label: "Aprovado",       cor: "bg-blue-50" },
  { key: "pedido_emitido", label: "Pedido Emitido", cor: "bg-yellow-50" },
  { key: "em_transito",    label: "Em Trânsito",    cor: "bg-orange-50" },
  { key: "recebido",       label: "Recebido",       cor: "bg-green-50" },
];

function CardPedido({ pedido }: { pedido: PedidoKanban }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: pedido.id,
    data: { pedido },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing select-none
        ${isDragging ? "opacity-40" : ""}
        ${pedido.prazo_vencido ? "border-destructive" : ""}
        ${pedido.prazo_proximo && !pedido.prazo_vencido ? "border-yellow-400" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-xs bg-muted px-1 rounded">
          {pedido.especificacao_codigo}
        </span>
        {pedido.prazo_vencido && (
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        )}
        {pedido.prazo_proximo && !pedido.prazo_vencido && (
          <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
        )}
      </div>
      <p className="text-sm font-medium mt-1 leading-tight line-clamp-2">
        {pedido.especificacao_descricao}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{pedido.fornecedor_nome}</p>
      <div className="flex items-center justify-between mt-2">
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
    </div>
  );
}

function ColunaKanban({
  coluna,
  pedidos,
}: {
  coluna: (typeof COLUNAS)[number];
  pedidos: PedidoKanban[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.key });

  return (
    <div className="flex flex-col min-w-[220px] flex-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{coluna.label}</h3>
        <Badge variant="secondary">{pedidos.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-lg p-2 space-y-2 min-h-[120px] transition-colors
          ${coluna.cor}
          ${isOver ? "ring-2 ring-primary ring-inset" : ""}
        `}
      >
        {pedidos.map((p) => (
          <CardPedido key={p.id} pedido={p} />
        ))}
        {pedidos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-4">Vazio</p>
        )}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const { data: board, isLoading } = useKanban();
  const atualizar = useAtualizarStatusPedido();
  const [ativo, setAtivo] = useState<PedidoKanban | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event: DragStartEvent) {
    const pedido = event.active.data.current?.pedido as PedidoKanban;
    setAtivo(pedido ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setAtivo(null);
    const { active, over } = event;
    if (!over) return;
    const novoStatus = over.id as StatusPedido;
    const pedido = active.data.current?.pedido as PedidoKanban;
    if (pedido.status !== novoStatus) {
      atualizar.mutate({ id: pedido.id, status: novoStatus });
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Carregando kanban...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pedidos — Kanban</h1>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUNAS.map((col) => (
            <ColunaKanban
              key={col.key}
              coluna={col}
              pedidos={board?.[col.key] ?? []}
            />
          ))}
        </div>

        <DragOverlay>
          {ativo && (
            <div className="rounded-lg border bg-white p-3 shadow-lg w-52 rotate-2 cursor-grabbing">
              <span className="font-mono text-xs bg-muted px-1 rounded">
                {ativo.especificacao_codigo}
              </span>
              <p className="text-sm font-medium mt-1">{ativo.especificacao_descricao}</p>
              <p className="text-xs text-muted-foreground">{ativo.fornecedor_nome}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className="flex gap-4 text-xs text-muted-foreground mt-2">
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-destructive" /> Prazo vencido
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-yellow-500" /> Prazo próximo (≤3 dias)
        </span>
      </div>
    </div>
  );
}
