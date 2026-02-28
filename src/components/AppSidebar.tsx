import { Wallet, LayoutDashboard, BarChart3, CalendarDays, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/charts", label: "Gráficos", icon: BarChart3 },
  { to: "/daily", label: "Diário", icon: CalendarDays },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export const AppSidebar = ({ onNavigate }: AppSidebarProps) => {
  const { user, signOut } = useAuth();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 pb-8 border-b">
        <div className="p-3 bg-primary rounded-3xl">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle Financeiro</h1>
          <p className="text-sm text-gray-600">Gerencie suas despesas</p>
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
