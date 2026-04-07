import { useResumoDashboard, useSavingGeral, useSlaMetrics } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ShoppingCart, Package, TrendingDown, Timer, Truck } from "lucide-react";

export default function DashboardPage() {
  const { data: resumo } = useResumoDashboard();
  const { data: saving } = useSavingGeral();
  const { data: sla } = useSlaMetrics();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resumo?.total_pedidos ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos em Aberto
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resumo?.pedidos_em_aberto ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saving Acumulado
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatarMoeda(resumo?.saving_acumulado)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SLA por fornecedor */}
      {sla && sla.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              SLA por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Fornecedor</th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Timer className="h-3.5 w-3.5" /> Tempo de Resposta
                      </span>
                    </th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Truck className="h-3.5 w-3.5" /> Tempo de Entrega
                      </span>
                    </th>
                    <th className="pb-2 font-medium text-right">Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {sla.map((row) => (
                    <tr key={row.fornecedor} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{row.fornecedor}</td>
                      <td className="py-2 pr-4 text-right">
                        {row.tempo_resposta_medio !== null ? (
                          <span
                            className={`font-mono ${
                              row.tempo_resposta_medio > 3
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {row.tempo_resposta_medio}d
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {row.tempo_entrega_medio !== null ? (
                          <span
                            className={`font-mono ${
                              row.tempo_entrega_medio > 7
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {row.tempo_entrega_medio}d
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {row.total_recebidos}/{row.total_com_emissao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Resposta &gt;3d em vermelho · Entrega &gt;7d em laranja · Pedidos: recebidos/emitidos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gráfico saving por fornecedor */}
      {saving && saving.por_fornecedor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saving por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={saving.por_fornecedor} margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fornecedor" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatarMoeda(v)} />
                <Bar dataKey="saving" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela saving por produto */}
      {saving && saving.por_especificacao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saving por Produto (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {saving.por_especificacao.slice(0, 10).map((item) => (
                <div key={item.codigo} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-muted-foreground">{item.codigo}</span>
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
