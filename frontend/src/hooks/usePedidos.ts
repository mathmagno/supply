import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Pedido, PedidoKanban, StatusPedido } from "@/lib/types";

export function useKanban() {
  return useQuery<Record<StatusPedido, PedidoKanban[]>>({
    queryKey: ["kanban"],
    queryFn: () => api.get("/pedidos/kanban").then((r) => r.data),
    refetchInterval: 30_000, // atualiza a cada 30 s
  });
}

export function usePedidos(status?: StatusPedido) {
  return useQuery<Pedido[]>({
    queryKey: ["pedidos", status],
    queryFn: () =>
      api.get("/pedidos", { params: { status } }).then((r) => r.data),
  });
}

export function useCriarPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      especificacao_id: number;
      fornecedor_id: number;
      cotacao_id?: number;
      quantidade?: number;
      preco_cotado: number;
      custo_planejado?: number;
      prazo_fornecedor?: string;
    }) => api.post("/pedidos", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
    },
  });
}

export function useAtualizarStatusPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      custo_comprado,
      data_recebimento,
    }: {
      id: number;
      status: StatusPedido;
      custo_comprado?: number;
      data_recebimento?: string;
    }) => api.patch(`/pedidos/${id}`, { status, custo_comprado, data_recebimento }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRemoverPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/pedidos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
    },
  });
}
