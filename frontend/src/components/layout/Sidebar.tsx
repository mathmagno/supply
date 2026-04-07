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
    <aside className="w-60 flex flex-col shrink-0 bg-[#0f172a]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/40">
            <span className="text-white text-xs font-black">S</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none tracking-wide">Supply</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Gestão de Compras</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {itensNav.map((item, i) => {
          if ("divider" in item) {
            return <div key={i} className="my-2 border-t border-white/5" />;
          }
          const Icone = item.icone;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 border",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icone className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-400" : "")} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5">
        <p className="text-[10px] text-slate-600 text-center tracking-wide">Supply v1.0</p>
      </div>
    </aside>
  );
}
