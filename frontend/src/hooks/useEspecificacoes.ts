import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Especificacao } from "@/lib/types";

export function useEspecificacoes(categoriaId?: number, busca?: string) {
  return useQuery<Especificacao[]>({
    queryKey: ["especificacoes", categoriaId, busca],
    queryFn: () =>
      api
        .get("/especificacoes", {
          params: { categoria_id: categoriaId, busca },
        })
        .then((r) => r.data),
  });
}

export function useCriarEspecificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Especificacao>) =>
      api.post("/especificacoes", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["especificacoes"] }),
  });
}

export function useAtualizarEspecificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dados }: Partial<Especificacao> & { id: number }) =>
      api.patch(`/especificacoes/${id}`, dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["especificacoes"] }),
  });
}

export function useRemoverEspecificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/especificacoes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["especificacoes"] }),
  });
}
