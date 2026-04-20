import { useState } from "react";
import { Plus, Save, Trash2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTariffs } from "@/hooks/useTariffs";
import type { ChannelTariff } from "@/lib/tariffsFirestore";
import { cn } from "@/lib/utils";

// ── Tabela de referência Shopee ──────────────────────────────────────────────
const SHOPEE_REF = [
  { faixa: "R$ 0 – R$ 79,99",    comissao: "20%", taxaFixa: "R$ 4,00"  },
  { faixa: "R$ 80 – R$ 99,99",   comissao: "14%", taxaFixa: "R$ 16,00" },
  { faixa: "R$ 100 – R$ 199,99", comissao: "14%", taxaFixa: "R$ 20,00" },
  { faixa: "R$ 200 – R$ 499,99", comissao: "14%", taxaFixa: "R$ 26,00" },
  { faixa: "R$ 500+",            comissao: "14%", taxaFixa: "R$ 26,00" },
];

// ── Tabela de referência Mercado Livre ───────────────────────────────────────
// ⚠️ Atualize os valores abaixo conforme a tabela atual do ML
const MELI_REF = [
  { faixa: "Abaixo de R$ 30",   premium: "—",     classico: "—",     taxaFixa: "Grátis (anúncio free)" },
  { faixa: "R$ 30 – R$ 79,99",  premium: "15%+",  classico: "10%+",  taxaFixa: "Sem taxa fixa"         },
  { faixa: "R$ 80 – R$ 229,99", premium: "16,5%", classico: "12,5%", taxaFixa: "R$ 6,00"               },
  { faixa: "R$ 230+",           premium: "16,5%", classico: "12,5%", taxaFixa: "Sem taxa fixa"          },
];

function RefTable({ children, title, badge }: { children: React.ReactNode; title: string; badge?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
              {badge}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▲ Ocultar" : "▼ Ver tabela"}</span>
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

export default function TariffsSettingsPage() {
  const { tariffs, loading, saving, updateChannel, addChannel, removeChannel, save } =
    useTariffs();

  const [activeGroup, setActiveGroup] = useState<"babyWorld" | "mpBabyStore">("babyWorld");
  const [newChannel, setNewChannel] = useState<ChannelTariff>({ name: "", commissionRate: 0, fixedFee: undefined });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await save();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAdd = () => {
    if (!newChannel.name.trim()) return;
    addChannel(activeGroup, {
      name: newChannel.name.trim().toUpperCase(),
      commissionRate: Number(newChannel.commissionRate) / 100,
      fixedFee: newChannel.fixedFee ? Number(newChannel.fixedFee) : undefined,
    });
    setNewChannel({ name: "", commissionRate: 0, fixedFee: undefined });
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20 text-muted-foreground">
        Carregando tarifas...
      </div>
    );
  }

  const channels = tariffs?.[activeGroup] ?? [];

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alteração de Tarifas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edite as tarifas de cada canal e consulte as tabelas de referência dos marketplaces</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            saved ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
        </button>
      </div>

      {/* Group Tabs */}
      <div className="flex gap-2">
        {(["babyWorld", "mpBabyStore"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeGroup === g
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {g === "babyWorld" ? "Baby World" : "MP Baby Store"}
          </button>
        ))}
      </div>

      {/* Channels Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Canais — {activeGroup === "babyWorld" ? "Baby World" : "MP Baby Store"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Canal</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Tarifa %</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Taxa Fixa R$</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, i) => (
                <tr key={ch.name + i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2 font-medium text-foreground">
                    <Input
                      value={ch.name}
                      onChange={(e) => updateChannel(activeGroup, i, { name: e.target.value.toUpperCase() })}
                      className="h-8 bg-secondary border-border font-mono text-xs"
                    />
                  </td>
                  <td className="px-4 py-2 w-32">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" step="0.1" min="0" max="100"
                        value={(ch.commissionRate * 100).toFixed(2)}
                        onChange={(e) => updateChannel(activeGroup, i, { commissionRate: Number(e.target.value) / 100 })}
                        className="h-8 bg-warning/10 border-warning/30 font-mono text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 w-36">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number" step="0.01" min="0"
                        value={ch.fixedFee ?? ""}
                        placeholder="—"
                        onChange={(e) => updateChannel(activeGroup, i, { fixedFee: e.target.value ? Number(e.target.value) : undefined })}
                        className="h-8 bg-secondary border-border font-mono text-xs text-center"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeChannel(activeGroup, i)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Channel */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Plus className="h-4 w-4 text-primary" />
          Adicionar Novo Canal
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label className="text-xs text-muted-foreground">Nome do Canal</Label>
            <Input
              placeholder="Ex: JAMBLE"
              value={newChannel.name}
              onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
              className="mt-1 font-mono text-sm uppercase"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tarifa %</Label>
            <Input
              type="number" step="0.1" min="0" max="100" placeholder="Ex: 14"
              value={newChannel.commissionRate || ""}
              onChange={(e) => setNewChannel({ ...newChannel, commissionRate: Number(e.target.value) })}
              className="mt-1 font-mono text-sm bg-warning/10 border-warning/30"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Taxa Fixa R$ (opcional)</Label>
            <Input
              type="number" step="0.01" min="0" placeholder="Ex: 16"
              value={newChannel.fixedFee ?? ""}
              onChange={(e) => setNewChannel({ ...newChannel, fixedFee: e.target.value ? Number(e.target.value) : undefined })}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAdd}
              disabled={!newChannel.name.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabelas de Referência ─────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Tabelas de Referência dos Marketplaces
        </h2>
        <div className="space-y-3">

          {/* Shopee */}
          <RefTable title="Shopee — Tabela de Comissão Progressiva" badge="Atualizada">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Faixa de Preço</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Comissão</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Taxa Fixa</th>
                </tr>
              </thead>
              <tbody>
                {SHOPEE_REF.map((row, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-secondary/20">
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{row.faixa}</td>
                    <td className="px-4 py-2 text-center font-mono text-xs text-warning">{row.comissao}</td>
                    <td className="px-4 py-2 text-center font-mono text-xs text-destructive">{row.taxaFixa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border/50">
              Fonte: Central do Vendedor Shopee · Valores sujeitos a alteração
            </p>
          </RefTable>

          {/* Mercado Livre */}
          <RefTable title="Mercado Livre — Comissões por Modalidade" badge="Verificar">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Faixa de Preço</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Premium</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Clássico</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Taxa Fixa</th>
                </tr>
              </thead>
              <tbody>
                {MELI_REF.map((row, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-secondary/20">
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{row.faixa}</td>
                    <td className="px-4 py-2 text-center font-mono text-xs text-warning">{row.premium}</td>
                    <td className="px-4 py-2 text-center font-mono text-xs text-warning">{row.classico}</td>
                    <td className="px-4 py-2 text-center font-mono text-xs text-destructive">{row.taxaFixa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border/50">
              ℹTarifas variam por categoria. Produtos de bebê geralmente entre 12,5% e 16,5%. 
              Taxa fixa de R$ 6,00 aplicada em vendas entre R$ 80 e R$ 229,99. 
              Confirme em mercadolivre.com.br/ajuda/1338
            </p>
          </RefTable>

        </div>
      </div>

    </div>
  );
}