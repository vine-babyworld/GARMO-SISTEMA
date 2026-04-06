import {
  Package,
  ShoppingBag,
  Store,
  Percent,
  Calculator,
  Eye,
  PackagePlus,
  RefreshCw,
  Settings,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { buildDashboardStats } from "@/data/mockData";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

const modules = [
  {
    label: "Precificação",
    desc: "Calcular preços por canal",
    icon: Calculator,
    path: "/pricing",
    color: "primary" as const,
  },
  {
    label: "Visão de Preços",
    desc: "Comparar preços entre canais",
    icon: Eye,
    path: "/price-view",
    color: "accent" as const,
  },

  // FUTURO: reativar quando houver integração com API
  // {
  //   label: "Mercado Livre",
  //   desc: "Gestão de anúncios ML",
  //   icon: ShoppingBag,
  //   path: "/mercado-livre",
  //   color: "warning" as const,
  // },
  // {
  //   label: "Shopee",
  //   desc: "Gestão Shopee",
  //   icon: Store,
  //   path: "/shopee",
  //   color: "success" as const,
  // },

  {
    label: "Cadastro de Produtos",
    desc: "Adicionar e editar produtos",
    icon: PackagePlus,
    path: "/products",
    color: "primary" as const,
  },
  {
    label: "Devoluções",
    desc: "Controle e acompanhamento de devoluções",
    icon: RotateCcw,
    path: "/devolucoes",
    color: "accent" as const,
  },

  // FUTURO: reativar quando houver necessidade de histórico/auditoria
  // {
  //   label: "Atualizações",
  //   desc: "Histórico de alterações",
  //   icon: RefreshCw,
  //   path: "/updates",
  //   color: "accent" as const,
  // },

  {
    label: "Configurações",
    desc: "Parâmetros do sistema",
    icon: Settings,
    path: "/settings",
    color: "warning" as const,
  },
];

const colorMap = {
  primary: "text-primary glow-orange border-primary/20",
  accent: "text-accent glow-blue border-accent/20",
  warning: "text-warning glow-yellow border-warning/20",
  success: "text-success border-success/20",
};

const iconBgMap = {
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  warning: "bg-warning/10",
  success: "bg-success/10",
};

const iconColorMap = {
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-warning",
  success: "text-success",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const statsData = buildDashboardStats(products);

  const stats = [
    {
      label: "Produtos Cadastrados",
      value: statsData.totalProducts.toLocaleString("pt-BR"),
      icon: Package,
      color: "primary" as const,
    },

    // FUTURO: reativar quando houver integração com API
    // {
    //   label: "Anúncios Mercado Livre",
    //   value: statsData.mlListings.toLocaleString("pt-BR"),
    //   icon: ShoppingBag,
    //   color: "accent" as const,
    // },
    // {
    //   label: "Produtos Shopee",
    //   value: statsData.shopeeProducts.toLocaleString("pt-BR"),
    //   icon: Store,
    //   color: "warning" as const,
    // },

    {
      label: "Imposto Global",
      value: `${statsData.globalTax}%`,
      icon: Percent,
      color: "success" as const,
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral do sistema de precificação
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-xl border bg-card p-5 card-hover",
              colorMap[stat.color]
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  iconBgMap[stat.color]
                )}
              >
                <stat.icon
                  className={cn("h-5 w-5", iconColorMap[stat.color])}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Módulos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((mod) => (
            <button
              key={mod.label}
              onClick={() => navigate(mod.path)}
              className={cn(
                "group flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left card-hover",
                colorMap[mod.color]
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  iconBgMap[mod.color]
                )}
              >
                <mod.icon className={cn("h-5 w-5", iconColorMap[mod.color])} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {mod.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {mod.desc}
                </p>
              </div>
              <ArrowRight className="mt-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}