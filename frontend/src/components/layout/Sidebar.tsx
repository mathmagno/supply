import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  KanbanSquare,
  Package,
  Tag,
  Truck,
  Upload,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const itensNav = [
  { to: "/dashboard",      icone: LayoutDashboard, label: "Dashboard" },
  { to: "/fornecedores",   icone: Truck,            label: "Fornecedores" },
  { to: "/cotacao",        icone: ClipboardList,    label: "Cotação" },
  { to: "/pedidos",        icone: KanbanSquare,     label: "Pedidos (Kanban)" },
  { to: "/historico",      icone: TrendingUp,       label: "Saving / Histórico" },
  { divider: true },
  { to: "/categorias",     icone: Tag,              label: "Categorias" },
  { to: "/especificacoes", icone: Package,          label: "Especificações" },
  { divider: true },
  { to: "/importacao",     icone: Upload,           label: "Importar Planilha" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 border-r bg-card flex flex-col">
      <div className="px-6 py-5 border-b">
        <h1 className="text-lg font-bold text-primary tracking-tight">
          Supply
        </h1>
        <p className="text-xs text-muted-foreground">Gestão de Compras</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {itensNav.map((item, i) => {
          if ("divider" in item) {
            return <hr key={i} className="my-2 border-border" />;
          }
          const Icone = item.icone;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <Icone className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
