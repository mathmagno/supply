import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Fornecedor } from "@/lib/types";

export function useSegmentos() {
  return useQuery<string[]>({
    queryKey: ["fornecedores-segmentos"],
    queryFn: () => api.get("/fornecedores/segmentos").then((r) => r.data),
  });
}

export function baixarModeloXlsx(segmento: string) {
  // Faz download direto via link — inclui o token no header via axios não funciona para download
  // Usamos fetch com blob
  return api
    .get("/fornecedores/modelo-xlsx", { params: { segmento }, responseType: "blob" })
    .then((r) => {
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotacao_${segmento.toLowerCase().replace(/\s+/g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    });
}

export function useFornecedores(apenasAtivos = true) {
  return useQuery<Fornecedor[]>({
    queryKey: ["fornecedores", apenasAtivos],
    queryFn: () =>
      api.get("/fornecedores", { params: { apenas_ativos: apenasAtivos } }).then((r) => r.data),
  });
}

export function useCriarFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Fornecedor>) => api.post("/fornecedores", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
}

export function useAtualizarFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dados }: Partial<Fornecedor> & { id: number }) =>
      api.patch(`/fornecedores/${id}`, dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
}

export function useRemoverFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/fornecedores/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
}
