import { useState, useMemo } from "react";
import { Search, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts } from "@/hooks/useProducts";
import {
  calculateBabyWorld,
  calculateMpBabyStore,
  calculateSiteBabyWorld,
  calculateMercadoPagoMachine,
  calculateItauMachine,
  type Product,
  type ChannelResult,
  type BabyWorldInputs,
  type MpBabyStoreInputs,
} from "@/types/pricing";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { fetchTariffs } from "@/lib/tariffsFirestore";
import { setBabyWorldChannels, setMpBabyStoreChannels } from "@/types/pricing";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Pricing() {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<
  "babyworld" | "sitebw" | "mercadopago" | "itau" | "mpbaby"
>("babyworld");
  const { products } = useProducts();

  // Carrega tarifas do Firebase e sobrescreve os arrays padrão
useEffect(() => {
  fetchTariffs().then((t) => {
    setBabyWorldChannels(t.babyWorld);
    setMpBabyStoreChannels(t.mpBabyStore);
  });
}, []);

  // Baby World inputs
  const [bw, setBw] = useState<BabyWorldInputs>({
    salePrice: 0, freight: 0, discountPercent: 0, bonus: 0, st: "NÃO",
  });

  // MP Baby Store inputs
  const [mp, setMp] = useState<MpBabyStoreInputs>({
    salePrice: 0, freight: 0, others: 0, bonus: 0, st: "NÃO",
    menos79: 0, taxPercent: 0.08, icmsVenda: 0,
  });

  const filtered = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return products
      .filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [search]);

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearch(product.sku + " - " + product.name);
    setShowDropdown(false);
    const defaultPrice = Math.round(product.cost * 2);
    setBw((prev) => ({ ...prev, salePrice: defaultPrice }));
    setMp((prev) => ({ ...prev, salePrice: defaultPrice }));
  };

  const bwResults = useMemo(() => {
    if (!selectedProduct) return null;
    return calculateBabyWorld(selectedProduct, bw);
  }, [selectedProduct, bw]);

  const mpResults = useMemo(() => {
    if (!selectedProduct) return null;
    return calculateMpBabyStore(selectedProduct, mp);
  }, [selectedProduct, mp]);

  const siteBwResults = useMemo(() => {
  if (!selectedProduct) return null;
  return calculateSiteBabyWorld(selectedProduct, bw);
}, [selectedProduct, bw]);

const mercadoPagoResults = useMemo(() => {
  if (!selectedProduct) return null;
  return calculateMercadoPagoMachine(selectedProduct, bw);
}, [selectedProduct, bw]);

const itauResults = useMemo(() => {
  if (!selectedProduct) return null;
  return calculateItauMachine(selectedProduct, bw);
}, [selectedProduct, bw]);

const activeResults = useMemo(() => {
  switch (activeTab) {
    case "babyworld":
      return bwResults?.results ?? [];
    case "sitebw":
      return siteBwResults?.results ?? [];
    case "mercadopago":
      return mercadoPagoResults?.results ?? [];
    case "itau":
      return itauResults?.results ?? [];
    case "mpbaby":
      return mpResults?.results ?? [];
    default:
      return [];
  }
}, [activeTab, bwResults, siteBwResults, mercadoPagoResults, itauResults, mpResults]);

const activeTitle =
  activeTab === "babyworld"
    ? "Baby World"
    : activeTab === "sitebw"
    ? "Site Baby World"
    : activeTab === "mercadopago"
    ? "Maquininha Mercado Pago"
    : activeTab === "itau"
    ? "Maquininha Itaú"
    : "MP Baby Store";

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Precificação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione um produto e configure os valores para cada canal
        </p>
      </div>

      {/* Search */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Buscar por SKU ou nome do produto..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setShowDropdown(true);
      }}
      onFocus={() => setShowDropdown(true)}
      className="border-border bg-card pl-10"
    />

    {showDropdown && filtered.length > 0 && (
      <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
        {filtered.map((p, i) => (
          <button
            key={p.sku + i}
            onClick={() => selectProduct(p)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
          >
            <span className="text-xs font-mono text-primary">{p.sku}</span>
            <span className="flex-1 truncate text-foreground">
              {p.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {fmt(p.cost)}
            </span>
          </button>
        ))}
      </div>
    )}
  </div>

  <div className="rounded-xl border border-border bg-card/70 px-4 py-3">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
      <TopMetric
        label="CMV / Custo"
        value={selectedProduct ? fmt(selectedProduct.cost) : "-"}
        tone="neutral"
      />
      <TopMetric
        label="ICMS Compra"
        value={
          selectedProduct
            ? `${(selectedProduct.icms * 100).toFixed(2)}%`
            : "-"
        }
        tone="debit"
      />
      <TopMetric
        label="IPI"
        value={
          selectedProduct
            ? `${(selectedProduct.ipi * 100).toFixed(2)}%`
            : "-"
        }
        tone="debit"
      />
      <TopMetric
        label="NCM"
        value={selectedProduct?.ncm || "-"}
        tone="neutral"
      />
    </div>
  </div>
</div>

      {/* Product Info */}
      {selectedProduct && (
  <div className="flex flex-wrap gap-2">
    <TabButton
      active={activeTab === "babyworld"}
      onClick={() => setActiveTab("babyworld")}
      label="Baby World"
      color="primary"
    />
    <TabButton
      active={activeTab === "sitebw"}
      onClick={() => setActiveTab("sitebw")}
      label="Site Baby World"
      color="accent"
    />
    <TabButton
      active={activeTab === "mercadopago"}
      onClick={() => setActiveTab("mercadopago")}
      label="Maquininha Mercado Pago"
      color="accent"
    />
    <TabButton
      active={activeTab === "itau"}
      onClick={() => setActiveTab("itau")}
      label="Maquininha Itaú"
      color="accent"
    />
    <TabButton
      active={activeTab === "mpbaby"}
      onClick={() => setActiveTab("mpbaby")}
      label="MP Baby Store - 8%"
      color="accent"
    />
  </div>
)}

    

      {/* Editable Fields */}
      {selectedProduct &&
  (activeTab === "babyworld" ||
    activeTab === "sitebw" ||
    activeTab === "mercadopago" ||
    activeTab === "itau") && (
    <div className="glow-orange rounded-xl border border-primary/20 bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
        <Calculator className="h-4 w-4" />
        {activeTab === "babyworld"
          ? "Campos Editáveis — Baby World"
          : activeTab === "sitebw"
          ? "Campos Editáveis — Site Baby World"
          : activeTab === "mercadopago"
          ? "Campos Editáveis — Maquininha Mercado Pago"
          : "Campos Editáveis — Maquininha Itaú"}
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <EditField
          label="Valor da Venda (R$)"
          value={bw.salePrice}
          onChange={(v) => setBw({ ...bw, salePrice: v })}
          highlight
        />
        <EditField
          label="Frete (R$)"
          value={bw.freight}
          onChange={(v) => setBw({ ...bw, freight: v })}
          highlight
        />
        <EditField
          label="Desconto %"
          value={bw.discountPercent * 100}
          onChange={(v) => setBw({ ...bw, discountPercent: v / 100 })}
          highlight
        />
        <EditField
          label="Bônus (R$)"
          value={bw.bonus}
          onChange={(v) => setBw({ ...bw, bonus: v })}
          highlight
        />

        <div>
          <Label className="text-xs text-muted-foreground">ST</Label>
          <select
            value={bw.st}
            onChange={(e) =>
              setBw({ ...bw, st: e.target.value as "SIM" | "NÃO" })
            }
            className="mt-1 w-full rounded-md border border-border bg-warning/10 px-3 py-2 text-sm font-mono text-foreground"
          >
            <option value="NÃO">NÃO</option>
            <option value="SIM">SIM</option>
          </select>
        </div>
      </div>
    </div>
  )}

      {selectedProduct && activeTab === "mpbaby" && (
        <div className="rounded-xl border border-accent/20 bg-card p-5 glow-blue">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-accent">
            <Calculator className="h-4 w-4" /> Campos Editáveis — MP Baby Store
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <EditField label="Valor da Venda (R$)" value={mp.salePrice} onChange={(v) => setMp({ ...mp, salePrice: v })} highlight />
            <EditField label="Frete (R$)" value={mp.freight} onChange={(v) => setMp({ ...mp, freight: v })} highlight />
            <EditField label="Outros (R$)" value={mp.others} onChange={(v) => setMp({ ...mp, others: v })} highlight />
            <EditField label="Bônus (R$)" value={mp.bonus} onChange={(v) => setMp({ ...mp, bonus: v })} highlight />
            <div>
              <Label className="text-xs text-muted-foreground">ST</Label>
              <select
                value={mp.st}
                onChange={(e) => setMp({ ...mp, st: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-warning/10 px-3 py-2 text-sm font-mono text-foreground"
              >
                <option value="NÃO">NÃO</option>
                <option value="SIM">SIM</option>
              </select>
            </div>
            <EditField label="Menos 79 (R$)" value={mp.menos79} onChange={(v) => setMp({ ...mp, menos79: v })} highlight />
            <EditField label="Imposto %" value={mp.taxPercent * 100} onChange={(v) => setMp({ ...mp, taxPercent: v / 100 })} highlight />
            <EditField label="ICMS Venda %" value={mp.icmsVenda * 100} onChange={(v) => setMp({ ...mp, icmsVenda: v / 100 })} highlight />
          </div>
        </div>
      )}

      {/* Results Table */}
      {activeResults && activeResults.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Resultado por Canal — {activeTitle}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Canal</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Vl. Venda</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Taxa %</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comissão R$</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Crédito MP</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Lucro Bruto</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">MC %</th>
                </tr>
              </thead>
              <tbody>
                {activeResults.map((r) => (
                  <tr key={r.channel} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{r.channel}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{fmt(r.salePrice)}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{r.commissionRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-mono text-destructive">
                    <div>{fmt(r.commissionValue)}</div>
                    {r.shopeeFixedFee !== undefined && r.shopeeFixedFee > 0 && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Tarifa fixa: {fmt(r.shopeeFixedFee)}
                      </div>
                    )}
                    {r.fixedFee !== undefined && r.fixedFee > 0 && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Tarifa fixa: {fmt(r.fixedFee)}
                      </div>
                    )}
                  </td>
                    <td className="px-4 py-3 text-right font-mono text-accent">{fmt(r.marketplaceCredit)}</td>
                    <td className={cn("px-4 py-3 text-right font-mono font-semibold", r.grossProfit >= 0 ? "text-success" : "text-destructive")}>
                      {fmt(r.grossProfit)}
                    </td>
                    <td className={cn("px-4 py-3 text-right font-mono font-bold", r.contributionMargin >= 15 ? "text-success" : r.contributionMargin >= 5 ? "text-warning" : "text-destructive")}>
                      {r.contributionMargin.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax details */}
      {selectedProduct &&
  (activeTab === "babyworld"
    ? bwResults
    : activeTab === "sitebw"
    ? siteBwResults
    : activeTab === "mercadopago"
    ? mercadoPagoResults
    : activeTab === "itau"
    ? itauResults
    : mpResults) && (
    <TaxDetails
      product={selectedProduct}
      showImpostoR={activeTab === "mpbaby"}
      taxes={
        activeTab === "babyworld"
          ? bwResults!.taxes
          : activeTab === "sitebw"
          ? siteBwResults!.taxes
          : activeTab === "mercadopago"
          ? mercadoPagoResults!.taxes
          : activeTab === "itau"
          ? itauResults!.taxes
          : mpResults!.taxes
      }
      salePrice={
        activeTab === "mpbaby" ? mp.salePrice : bw.salePrice
      }
    />
  )}
    </div>
  );
}

function TaxDetails({
  product,
  taxes,
  salePrice,
  showImpostoR = false,
}: {
  product: Product;
  taxes: import("@/types/pricing").TaxCalc & { impostoR?: number };
  salePrice: number;
  showImpostoR?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Detalhes Fiscais
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <TaxItem
          label="NCM"
          value={product.ncm || ""}
          tone="neutral"
        />

        <TaxItem
          label="ICMS Venda"
          value={`${(taxes.icmsVenda * 100).toFixed(0)}%`}
          tone="debit"
        />

        {showImpostoR && taxes.impostoR !== undefined && (
          <TaxItem
            label="Imposto (R$)"
            value={fmt(taxes.impostoR)}
            tone="debit"
          />
        )}

        <TaxItem
          label="IPI (R$)"
          value={fmt(taxes.ipiValue)}
          tone="debit"
        />

        <TaxItem
          label="Crédito ICMS"
          value={fmt(taxes.creditoIcms)}
          tone="credit"
        />

        <TaxItem
          label="Débito ICMS"
          value={fmt(taxes.debitoIcms)}
          tone="debit"
        />

        <TaxItem
          label="PIS"
          value={`${(taxes.pis * 100).toFixed(2)}%`}
          tone="debit"
        />

        <TaxItem
          label="COFINS"
          value={`${(taxes.cofins * 100).toFixed(1)}%`}
          tone="debit"
        />

        <TaxItem
          label="Crédito PIS $"
          value={fmt(taxes.creditoPis)}
          tone="credit"
        />

        <TaxItem
          label="Crédito COFINS $"
          value={fmt(taxes.creditoCofins)}
          tone="credit"
        />

        <TaxItem
          label="Créd. ICMS Frete"
          value={fmt(taxes.creditosIcmsFrete)}
          tone="credit"
        />

        <TaxItem
          label="Créd. PIS/COF Frete"
          value={fmt(taxes.creditosPisCofFrete)}
          tone="credit"
        />

        <TaxItem
          label="Débito PIS/COFINS"
          value={fmt(taxes.debitoPisCofins)}
          tone="debit"
        />
      </div>
    </div>
  );
}

function TaxItem({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "credit" | "debit" | "neutral";
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-medium",
          tone === "credit"
            ? "text-success"
            : tone === "debit"
            ? "text-destructive"
            : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TabButton({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: "primary" | "accent" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-all",
        active
          ? color === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
    >
      {label}
    </button>
  );
}

function QuickCalcCard({
  title,
  subtitle,
  icon: Icon,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-secondary/20 hover:bg-secondary/40"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            active ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function TopMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "credit" | "debit";
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-sm font-semibold",
          tone === "credit"
            ? "text-success"
            : tone === "debit"
            ? "text-destructive"
            : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Info({ label, value, highlight, className }: { label: string; value: string; highlight?: boolean; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-semibold truncate", highlight ? "text-primary" : "text-foreground")}>{value}</p>
    </div>
  );
}

function EditField({ label, value, onChange, highlight }: { label: string; value: number; onChange: (v: number) => void; highlight?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("mt-1 font-mono text-sm", highlight ? "bg-warning/10 border-warning/30" : "bg-secondary border-border")}
      />
    </div>
  );
}
