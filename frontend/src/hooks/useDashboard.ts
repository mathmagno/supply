import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ResumoDashboard, SavingGeral, HistoricoPrecos } from "@/lib/types";

export function useResumoDashboard() {
  return useQuery<ResumoDashboard>({
    queryKey: ["dashboard", "resumo"],
    queryFn: () => api.get("/dashboard/resumo").then((r) => r.data),
  });
}

export function useSavingGeral(dataInicio?: string, dataFim?: string) {
  return useQuery<SavingGeral>({
    queryKey: ["dashboard", "saving", dataInicio, dataFim],
    queryFn: () =>
      api
        .get("/dashboard/saving", {
          params: { data_inicio: dataInicio, data_fim: dataFim },
        })
        .then((r) => r.data),
  });
}

export function useHistoricoPrecos(especificacaoId: number | undefined) {
  return useQuery<HistoricoPrecos>({
    queryKey: ["historico-precos", especificacaoId],
    queryFn: () =>
      api.get(`/dashboard/historico-precos/${especificacaoId}`).then((r) => r.data),
    enabled: !!especificacaoId,
  });
}
