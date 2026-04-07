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

function KpiCard({
  label,
  valor,
  icone: Icone,
  iconeBg,
  iconeColor,
  valorColor,
}: {
  label: string;
  valor: React.ReactNode;
  icone: React.ElementType;
  iconeBg: string;
  iconeColor: string;
  valorColor?: string;
}) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {label}
            </p>
            <p className={`text-3xl font-bold tracking-tight ${valorColor ?? "text-foreground"}`}>
              {valor}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconeBg}`}>
            <Icone className={`h-5 w-5 ${iconeColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: resumo } = useResumoDashboard();
  const { data: saving } = useSavingGeral();
  const { data: sla } = useSlaMetrics();

  return (
    <div className="space-y-7 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral de compras e performance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total de Pedidos"
          valor={resumo?.total_pedidos ?? "—"}
          icone={ShoppingCart}
          iconeBg="bg-blue-50"
          iconeColor="text-blue-500"
        />
        <KpiCard
          label="Pedidos em Aberto"
          valor={resumo?.pedidos_em_aberto ?? "—"}
          icone={Package}
          iconeBg="bg-amber-50"
          iconeColor="text-amber-500"
        />
        <KpiCard
          label="Saving Acumulado"
          valor={formatarMoeda(resumo?.saving_acumulado)}
          icone={TrendingDown}
          iconeBg="bg-emerald-50"
          iconeColor="text-emerald-500"
          valorColor="text-emerald-600"
        />
      </div>

      {/* SLA por fornecedor */}
      {sla && sla.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <Timer className="h-4 w-4 text-violet-500" />
              </div>
              SLA por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fornecedor</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Timer className="h-3 w-3" /> Resposta
                      </span>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Truck className="h-3 w-3" /> Entrega
                      </span>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Pedidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sla.map((row) => (
                    <tr key={row.fornecedor} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{row.fornecedor}</td>
                      <td className="px-4 py-3 text-right">
                        {row.tempo_resposta_medio !== null ? (
                          <span className={`inline-flex items-center justify-center font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                            row.tempo_resposta_medio > 3
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {row.tempo_resposta_medio}d
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.tempo_entrega_medio !== null ? (
                          <span className={`inline-flex items-center justify-center font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                            row.tempo_entrega_medio > 7
                              ? "bg-orange-50 text-orange-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {row.tempo_entrega_medio}d
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">
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
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-blue-500" />
              </div>
              Saving por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={saving.por_fornecedor} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fornecedor" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [formatarMoeda(v), "Saving"]}
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Bar dataKey="saving" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela saving por produto */}
      {saving && saving.por_especificacao.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Package className="h-4 w-4 text-emerald-500" />
              </div>
              Saving por Produto
              <span className="text-xs font-normal text-muted-foreground ml-1">Top 10</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {saving.por_especificacao.slice(0, 10).map((item, i) => (
                <div
                  key={item.codigo}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                      {item.codigo}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{formatarMoeda(item.saving)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
