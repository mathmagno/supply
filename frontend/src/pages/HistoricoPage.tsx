import { useState } from "react";
import { useSavingGeral, useHistoricoPrecos } from "@/hooks/useDashboard";
import { useEspecificacoes } from "@/hooks/useEspecificacoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatarMoeda } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const CORES = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export default function HistoricoPage() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [specId, setSpecId] = useState<number | undefined>();

  const { data: saving } = useSavingGeral(dataInicio || undefined, dataFim || undefined);
  const { data: especificacoes = [] } = useEspecificacoes();
  const { data: historico } = useHistoricoPrecos(specId);

  // Monta dataset para o gráfico de linhas (uma linha por fornecedor)
  const datasHistorico = historico?.series
    ? (() => {
        const datas = new Set<string>();
        historico.series.forEach((s) => s.dados.forEach((d) => datas.add(d.data)));
        return Array.from(datas)
          .sort()
          .map((data) => {
            const ponto: Record<string, string | number> = { data };
            historico.series.forEach((s) => {
              const d = s.dados.find((x) => x.data === data);
              if (d) ponto[s.fornecedor] = d.preco;
            });
            return ponto;
          });
      })()
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saving & Histórico de Preços</h1>

      {/* Filtro de período */}
      <div className="flex gap-4 items-end">
        <div className="space-y-1">
          <Label>Data início</Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label>Data fim</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Cards de resumo */}
      {saving && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground">Saving no Período</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatarMoeda(saving.saving_total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground">Gasto Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatarMoeda(saving.gasto_total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground">Pedidos Recebidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{saving.total_pedidos_recebidos}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de preços */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Preços por Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={(v) => setSpecId(Number(v))}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {especificacoes.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.codigo} — {e.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {datasHistorico.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datasHistorico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatarMoeda(v)} />
                <Legend />
                {historico?.series.map((s, i) => (
                  <Line
                    key={s.fornecedor}
                    type="monotone"
                    dataKey={s.fornecedor}
                    stroke={CORES[i % CORES.length]}
                    strokeWidth={2}
                    dot
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}

          {specId && datasHistorico.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem histórico de preços para este produto.</p>
          )}
        </CardContent>
      </Card>

      {/* Saving por fornecedor */}
      {saving && saving.por_fornecedor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saving por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {saving.por_fornecedor.map((item) => (
                <div key={item.fornecedor} className="flex justify-between py-2 text-sm">
                  <span>{item.fornecedor}</span>
                  <span className="font-semibold text-green-600">{formatarMoeda(item.saving)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
