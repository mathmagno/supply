import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata número como moeda BRL */
export function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

/** Formata data ISO para dd/mm/yyyy */
export function formatarData(data: string | null | undefined): string {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Retorna true se a data já passou (prazo vencido) */
export function prazoVencido(data: string | null | undefined): boolean {
  if (!data) return false;
  return new Date(data) < new Date();
}
