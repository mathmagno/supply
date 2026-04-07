import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { CotacaoComparativa, SessaoCotacao } from "@/lib/types";

export function useSessoesCotacao() {
  return useQuery<SessaoCotacao[]>({
    queryKey: ["sessoes-cotacao"],
    queryFn: () => api.get("/cotacoes/sessoes").then((r) => r.data),
    refetchInterval: 15_000,       // atualiza status kanban a cada 15s
    refetchOnWindowFocus: true,    // atualiza ao voltar para a aba
  });
}

export function useCotacaoComparativa(sessaoId: number | undefined) {
  return useQuery<CotacaoComparativa[]>({
    queryKey: ["cotacao-comparativa", sessaoId],
    queryFn: () =>
      api.get("/cotacoes/comparativa", { params: { sessao_id: sessaoId } }).then((r) => r.data),
    enabled: !!sessaoId,
  });
}

export function useCriarSessaoCotacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { data_cotacao: string; descricao?: string }) =>
      api.post("/cotacoes/sessoes", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessoes-cotacao"] }),
  });
}

export function useRemoverSessao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/cotacoes/sessoes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessoes-cotacao"] }),
  });
}
