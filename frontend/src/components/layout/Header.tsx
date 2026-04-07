import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { usuario, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{usuario?.nome ?? "Usuário"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="gap-1">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
