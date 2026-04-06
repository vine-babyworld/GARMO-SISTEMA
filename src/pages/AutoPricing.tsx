import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Search,
  Target,
  RotateCcw,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { fetchFreightSettings } from "@/lib/settingsFirestore";
import {
  calculateAutoPricingForBabyWorld,
  type AutoPricingMode,
  type AutoPricingResult,
} from "@/lib/autoPricing";
import type { Product } from "@/types/pricing";

type FreightSettings = {
  pequeno: number;
  medio: number;
  grande: number;
  extra_grande: number;
};

function parseDecimal(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return NaN;
  return Number(normalized);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function getPorteLabel(porte: Product["porte"]) {
  switch (porte) {
    case "pequeno":
      return "Pequeno";
    case "medio":
      return "Médio";
    case "grande":
      return "Grande";
    case "extra_grande":
      return "Extra Grande";
    default:
      return "Médio";
  }
}

function getFreightByProductSize(
  porte: Product["porte"],
  freightSettings: FreightSettings
) {
  return freightSettings[porte];
}

function getCommercialPrice(value: number) {
  const integerPart = Math.floor(value);
  return integerPart + 0.9;
}

function getChannelBadgeVariant(index: number, total: number) {
  if (index === 0) {
    return {
      rowClass: "bg-emerald-500/5",
      badgeClass: "bg-emerald-500/15 text-emerald-400",
      label: "Melhor",
    };
  }

  if (index === total - 1) {
    return {
      rowClass: "bg-amber-500/5",
      badgeClass: "bg-amber-500/15 text-amber-400",
      label: "Mais caro",
    };
  }

  return {
    rowClass: "",
    badgeClass: "bg-sky-500/15 text-sky-400",
    label: "Intermediário",
  };
}

function getGapPercent(current: number, base: number) {
  if (base <= 0) return 0;
  return ((current - base) / base) * 100;
}

function getOperationalStatus(gapPercent: number) {
  if (gapPercent <= 5) {
    return {
      label: "Competitivo",
      className: "bg-emerald-500/15 text-emerald-400",
    };
  }

  if (gapPercent <= 15) {
    return {
      label: "Atenção",
      className: "bg-amber-500/15 text-amber-400",
    };
  }

  return {
    label: "Pesado",
    className: "bg-red-500/15 text-red-400",
  };
}

export default function AutoPricing() {
  const { rawProducts, loading: loadingProducts } = useProducts();

  const [freightSettings, setFreightSettings] =
    useState<FreightSettings | null>(null);
  const [loadingFreight, setLoadingFreight] = useState(true);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [targetMode, setTargetMode] = useState<AutoPricingMode>("margin");
  const [targetValue, setTargetValue] = useState("");
  const [result, setResult] = useState<AutoPricingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    async function loadFreightSettings() {
      try {
        setLoadingFreight(true);
        const data = await fetchFreightSettings();
        setFreightSettings(data);
      } catch (error) {
        console.error("Erro ao carregar frete médio:", error);
        setErrorMessage("Não foi possível carregar as configurações de frete.");
      } finally {
        setLoadingFreight(false);
      }
    }

    loadFreightSettings();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchInput.trim().toLowerCase();

    if (!q) return rawProducts.slice(0, 8);

    return rawProducts
      .filter(
        (product) =>
          product.sku.toLowerCase().includes(q) ||
          product.name.toLowerCase().includes(q) ||
          (product.supplier || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [rawProducts, searchInput]);

  const selectedProduct = useMemo(
    () => rawProducts.find((product) => product.id === selectedProductId) ?? null,
    [rawProducts, selectedProductId]
  );

  const freightUsed = useMemo(() => {
    if (!selectedProduct || !freightSettings) return null;
    return getFreightByProductSize(selectedProduct.porte, freightSettings);
  }, [selectedProduct, freightSettings]);

  const sortedChannels = useMemo(() => {
    if (!result) return [];
    return [...result.channels].sort((a, b) => a.salePrice - b.salePrice);
  }, [result]);

  const bestChannel = useMemo(() => {
    if (sortedChannels.length === 0) return null;
    return sortedChannels[0];
  }, [sortedChannels]);

  const worstChannel = useMemo(() => {
    if (sortedChannels.length === 0) return null;
    return sortedChannels[sortedChannels.length - 1];
  }, [sortedChannels]);

  const cockpitMetrics = useMemo(() => {
    if (sortedChannels.length === 0 || !bestChannel || !worstChannel) return null;

    const averageTechnicalPrice =
      sortedChannels.reduce((sum, channel) => sum + channel.salePrice, 0) /
      sortedChannels.length;

    const averageCommercialPrice =
      sortedChannels.reduce(
        (sum, channel) => sum + getCommercialPrice(channel.salePrice),
        0
      ) / sortedChannels.length;

    const spreadValue = worstChannel.salePrice - bestChannel.salePrice;
    const spreadPercent = getGapPercent(
      worstChannel.salePrice,
      bestChannel.salePrice
    );

    return {
      averageTechnicalPrice,
      averageCommercialPrice,
      spreadValue,
      spreadPercent,
    };
  }, [sortedChannels, bestChannel, worstChannel]);

  function handleSelectProduct(product: Product) {
    setSelectedProductId(product.id);
    setSearchInput(`${product.sku} — ${product.name}`);
    setShowSuggestions(false);
    setErrorMessage("");
  }

  function handleClear() {
    setSearchInput("");
    setSelectedProductId("");
    setShowSuggestions(false);
    setTargetMode("margin");
    setTargetValue("");
    setResult(null);
    setErrorMessage("");
  }

  async function handleCalculate() {
    setErrorMessage("");
    setResult(null);

    if (!selectedProduct) {
      setErrorMessage("Selecione um produto para calcular.");
      return;
    }

    if (!freightSettings) {
      setErrorMessage("As configurações de frete ainda não foram carregadas.");
      return;
    }

    const parsedTargetValue = parseDecimal(targetValue);

    if (
      targetValue.trim() === "" ||
      Number.isNaN(parsedTargetValue) ||
      parsedTargetValue < 0
    ) {
      setErrorMessage(
        targetMode === "margin"
          ? "Informe uma margem válida."
          : "Informe um lucro válido."
      );
      return;
    }

    try {
      setIsCalculating(true);

      const freight = getFreightByProductSize(
        selectedProduct.porte,
        freightSettings
      );

      const autoPricingResult = calculateAutoPricingForBabyWorld(
        selectedProduct,
        freight,
        {
          mode: targetMode,
          value: parsedTargetValue,
        }
      );

      setResult(autoPricingResult);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Erro ao calcular precificação automática:", error);
      setErrorMessage("Não foi possível calcular a precificação automática.");
    } finally {
      setIsCalculating(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Precificação Automática
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina uma meta de lucro ou margem e descubra o preço ideal de venda em
          cada canal.
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Meta de precificação
            </h2>
            <p className="text-sm text-muted-foreground">
              Escolha um produto, defina a meta e calcule automaticamente.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Produto
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSelectedProductId("");
                  setShowSuggestions(true);
                  setResult(null);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Buscar por SKU, nome ou fornecedor"
                className="pl-9"
                disabled={loadingProducts}
              />

              {showSuggestions && filteredProducts.length > 0 && (
                <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="flex w-full flex-col items-start border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-secondary/20"
                    >
                      <span className="font-medium text-foreground">
                        {product.sku} — {product.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.supplier || "Sem fornecedor"} •{" "}
                        {getPorteLabel(product.porte)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Modo da meta
            </label>
            <select
              value={targetMode}
              onChange={(e) => setTargetMode(e.target.value as AutoPricingMode)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="margin">Margem %</option>
              <option value="profit">Lucro R$</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {targetMode === "margin"
                ? "Meta de margem (%)"
                : "Meta de lucro (R$)"}
            </label>
            <Input
              inputMode="decimal"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder={
                targetMode === "margin" ? "Ex: 12,02" : "Ex: 176,64"
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Frete aplicado
            </label>
            <Input
              value={
                freightUsed !== null
                  ? formatCurrency(freightUsed)
                  : "Aguardando seleção"
              }
              readOnly
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Porte do produto
            </label>
            <Input
              value={
                selectedProduct
                  ? getPorteLabel(selectedProduct.porte)
                  : "Aguardando seleção"
              }
              readOnly
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleCalculate}
              className="w-full gap-2"
              disabled={isCalculating || loadingProducts || loadingFreight}
            >
              <Calculator className="h-4 w-4" />
              {isCalculating ? "Calculando..." : "Calcular preços ideais"}
            </Button>

            <Button variant="outline" onClick={handleClear} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Dados do produto
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="text-sm text-muted-foreground">SKU</p>
              <p className="font-medium text-foreground">{selectedProduct.sku}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Produto</p>
              <p className="font-medium text-foreground">{selectedProduct.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Custo</p>
              <p className="font-medium text-foreground">
                {formatCurrency(selectedProduct.cost)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">NCM</p>
              <p className="font-medium text-foreground">{selectedProduct.ncm}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Porte</p>
              <p className="font-medium text-foreground">
                {getPorteLabel(selectedProduct.porte)}
              </p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Meta aplicada
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-sm text-muted-foreground">Modo</p>
                <p className="mt-1 font-semibold text-foreground">
                  {targetMode === "margin" ? "Margem %" : "Lucro R$"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-sm text-muted-foreground">Meta</p>
                <p className="mt-1 font-semibold text-foreground">
                  {targetMode === "margin"
                    ? formatPercent(parseDecimal(targetValue || "0"))
                    : formatCurrency(parseDecimal(targetValue || "0"))}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-sm text-muted-foreground">Frete usado</p>
                <p className="mt-1 font-semibold text-foreground">
                  {formatCurrency(result.freightUsed)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm text-muted-foreground">Canal mais eficiente</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">
                {bestChannel?.channel ?? "—"}
              </p>
              <p className="mt-1 text-sm text-foreground">
                Preço técnico:{" "}
                <span className="font-semibold">
                  {bestChannel ? formatCurrency(bestChannel.salePrice) : "—"}
                </span>
              </p>
              <p className="text-sm text-foreground">
                Preço sugerido:{" "}
                <span className="font-semibold">
                  {bestChannel
                    ? formatCurrency(getCommercialPrice(bestChannel.salePrice))
                    : "—"}
                </span>
              </p>
              <p className="text-sm text-foreground">
                Lucro:{" "}
                <span className="font-semibold">
                  {bestChannel ? formatCurrency(bestChannel.grossProfit) : "—"}
                </span>
              </p>
              <p className="text-sm text-foreground">
                MC:{" "}
                <span className="font-semibold">
                  {bestChannel
                    ? formatPercent(bestChannel.contributionMargin)
                    : "—"}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-muted-foreground">
                Canal com maior preço exigido
              </p>
              <p className="mt-1 text-lg font-bold text-amber-400">
                {worstChannel?.channel ?? "—"}
              </p>
              <p className="mt-1 text-sm text-foreground">
                Preço técnico:{" "}
                <span className="font-semibold">
                  {worstChannel ? formatCurrency(worstChannel.salePrice) : "—"}
                </span>
              </p>
              <p className="text-sm text-foreground">
                Preço sugerido:{" "}
                <span className="font-semibold">
                  {worstChannel
                    ? formatCurrency(getCommercialPrice(worstChannel.salePrice))
                    : "—"}
                </span>
              </p>
              <p className="text-sm text-foreground">
                Lucro:{" "}
                <span className="font-semibold">
                  {worstChannel
                    ? formatCurrency(worstChannel.grossProfit)
                    : "—"}
                </span>
              </p>
              <p className="text-sm text-foreground">
                MC:{" "}
                <span className="font-semibold">
                  {worstChannel
                    ? formatPercent(worstChannel.contributionMargin)
                    : "—"}
                </span>
              </p>
            </div>
          </div>

          {cockpitMetrics && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Cockpit de Pricing
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Leitura estratégica dos canais para apoiar decisão de anúncio.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground">
                    Canal referência
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {bestChannel?.channel ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground">
                    Média preço técnico
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatCurrency(cockpitMetrics.averageTechnicalPrice)}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground">
                    Média preço sugerido
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatCurrency(cockpitMetrics.averageCommercialPrice)}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground">
                    Amplitude entre canais
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatCurrency(cockpitMetrics.spreadValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(cockpitMetrics.spreadPercent)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border bg-secondary/20 px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Resultado automático por canal
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Canais ordenados do menor para o maior preço técnico necessário.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1450px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Canal
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Preço técnico
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Preço sugerido
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Gap vs melhor
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Comissão R$
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Crédito MP
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Lucro bruto
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      MC %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedChannels.map((channel, index) => {
                    const variant = getChannelBadgeVariant(
                      index,
                      sortedChannels.length
                    );
                    const gapValue = bestChannel
                      ? channel.salePrice - bestChannel.salePrice
                      : 0;
                    const gapPercent = bestChannel
                      ? getGapPercent(channel.salePrice, bestChannel.salePrice)
                      : 0;
                    const status = getOperationalStatus(gapPercent);

                    return (
                      <tr
                        key={channel.channel}
                        className={[
                          "border-b border-border/50 transition-colors hover:bg-secondary/20",
                          variant.rowClass,
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{channel.channel}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${variant.badgeClass}`}
                            >
                              {variant.label}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-foreground">
                          {formatCurrency(channel.salePrice)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-primary">
                          {formatCurrency(getCommercialPrice(channel.salePrice))}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-foreground">
                          {index === 0 ? (
                            "Referência"
                          ) : (
                            <>
                              <div>{formatCurrency(gapValue)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatPercent(gapPercent)}
                              </div>
                            </>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-red-500">
                          {formatCurrency(channel.commissionValue)}
                          {channel.shopeeFixedFee !== undefined && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Tarifa fixa:{" "}
                              {formatCurrency(channel.shopeeFixedFee)}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-sky-400">
                          {formatCurrency(channel.marketplaceCredit)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-emerald-400">
                          {formatCurrency(channel.grossProfit)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-amber-400">
                          {formatPercent(channel.contributionMargin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}