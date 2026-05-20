import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  Eye,
  PackagePlus,
  Settings,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Target,
  LogOut,
  ChevronDown,
  ChevronUp,
  Truck,
  Users,
  Percent,
  BarChart2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { AtlasLogo } from "@/components/AtlasLogo";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Precificação", icon: Calculator, path: "/pricing" },
  { label: "Precificação Automática", icon: Target, path: "/auto-pricing" },
  { label: "Visão de Preços", icon: Eye, path: "/price-view" },

  { label: "Cadastro de Produtos", icon: PackagePlus, path: "/products" },
  { label: "Devoluções", icon: RotateCcw, path: "/devolucoes" },
  { label: "Diagnóstico ML", icon: BarChart2, path: "/ml-diagnostico" },
];

const settingsSubmenu = [
  {
    label: "Frete",
    icon: Truck,
    path: "/settings/freight",
  },
  {
    label: "Cadastro de usuários",
    icon: Users,
    path: "/settings/users",
  },
  {
    label: "Alteração de tarifas",
    icon: Percent,
    path: "/settings/tariffs",
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();

  const isSettingsRoute = settingsSubmenu.some((item) =>
    location.pathname.startsWith(item.path)
  );

  useEffect(() => {
    if (isSettingsRoute) {
      setSettingsOpen(true);
    }
  }, [isSettingsRoute]);

  function isItemActive(path: string) {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        {collapsed ? (
          <AtlasLogo variant="icon" strokeColor="#FFFFFF" className="h-7 w-7 shrink-0" />
        ) : (
          <AtlasLogo variant="horizontal" strokeColor="#FFFFFF" className="h-8 w-auto" />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isItemActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}

          <li className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false);
                  setSettingsOpen(true);
                  return;
                }
                setSettingsOpen((prev) => !prev);
              }}
              className={cn(
                "flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isSettingsRoute
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />

              {!collapsed && (
                <>
                  <span className="ml-3 flex-1 text-left">Configurações</span>
                  {settingsOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  )}
                </>
              )}
            </button>

            {!collapsed && settingsOpen && (
              <ul className="mt-1 space-y-1 pl-4">
                {settingsSubmenu.map((subItem) => {
                  const subActive = isItemActive(subItem.path);

                  return (
                    <li key={subItem.path}>
                      <Link
                        to={subItem.path}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          subActive
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <subItem.icon className="h-4 w-4 shrink-0" />
                        <span>{subItem.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-border text-muted-foreground transition-colors hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <button
        onClick={async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Erro ao sair:", error);
          }
        }}
        className="flex items-center gap-3 border-t border-border px-3 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Sair</span>}
      </button>
    </aside>
  );
}