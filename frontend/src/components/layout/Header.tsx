import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { usuario, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-card/80 backdrop-blur-sm flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
          <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="h-3 w-3 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {usuario?.nome ?? "Usuário"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-8"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </Button>
      </div>
    </header>
  );
}
