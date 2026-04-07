import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Categoria } from "@/lib/types";

export function useCategorias() {
  return useQuery<Categoria[]>({
    queryKey: ["categorias"],
    queryFn: () => api.get("/categorias").then((r) => r.data),
  });
}

export function useCriarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { nome: string }) => api.post("/categorias", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }),
  });
}

export function useAtualizarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nome }: { id: number; nome: string }) =>
      api.patch(`/categorias/${id}`, { nome }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }),
  });
}

export function useRemoverCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/categorias/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }),
  });
}

export function useSincronizarSegmentos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/categorias/sincronizar-segmentos"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }),
  });
}
