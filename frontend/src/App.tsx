import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CotacaoPage from "@/pages/CotacaoPage";
import KanbanPage from "@/pages/KanbanPage";
import CategoriasPage from "@/pages/CategoriasPage";
import EspecificacoesPage from "@/pages/EspecificacoesPage";
import FornecedoresPage from "@/pages/FornecedoresPage";
import ImportacaoPage from "@/pages/ImportacaoPage";
import HistoricoPage from "@/pages/HistoricoPage";

function RotaProtegida({ children }: { children: React.ReactNode }) {
  // AUTH_DISABLED: bypass login em desenvolvimento
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RotaProtegida>
              <Layout />
            </RotaProtegida>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cotacao" element={<CotacaoPage />} />
          <Route path="pedidos" element={<KanbanPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="especificacoes" element={<EspecificacoesPage />} />
          <Route path="fornecedores" element={<FornecedoresPage />} />
          <Route path="importacao" element={<ImportacaoPage />} />
          <Route path="historico" element={<HistoricoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
