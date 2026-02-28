import { useEffect, useState } from "react";
import { Wallet, LayoutDashboard, BarChart3, CalendarDays, ReceiptText, CreditCard, LogOut, Moon, Sun } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/charts", label: "Gráficos", icon: BarChart3 },
  { to: "/daily", label: "Diário", icon: CalendarDays },
  { to: "/resultado-mensal", label: "Resultado PF x PJ", icon: ReceiptText },
  { to: "/emprestimos", label: "Empréstimos", icon: CreditCard },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export const AppSidebar = ({ onNavigate }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 pb-8 border-b">
        <div className="p-3 bg-primary rounded-3xl">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controle Financeiro</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas despesas</p>
        </div>
      </div>

      <nav className="pt-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} onClick={onNavigate}>
              {({ isActive }) => (
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Modo claro" : "Modo escuro"}
        </Button>
        <p className="text-xs text-muted-foreground truncate" title={user?.email ?? "Usuário"}>
          {user?.email ?? "Usuário"}
        </p>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            onNavigate?.();
            signOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};
