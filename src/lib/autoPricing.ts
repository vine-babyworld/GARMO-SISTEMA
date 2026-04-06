import type { Product, ChannelResult, TaxCalc, BabyWorldInputs } from "@/types/pricing";
import { calculateBabyWorld } from "@/types/pricing";

export type AutoPricingMode = "profit" | "margin";

export interface AutoPricingTarget {
  mode: AutoPricingMode;
  value: number;
}

export interface AutoPricingChannelResult {
  channel: string;
  targetMode: AutoPricingMode;
  targetValue: number;
  salePrice: number;
  grossProfit: number;
  contributionMargin: number;
  commissionValue: number;
  marketplaceCredit: number;
  commissionRate: number;
  shopeeFixedFee?: number;
}

export interface AutoPricingResult {
  freightUsed: number;
  channels: AutoPricingChannelResult[];
  taxes?: TaxCalc;
}

const DEFAULT_INPUTS: Omit<BabyWorldInputs, "salePrice" | "freight"> = {
  discountPercent: 0,
  bonus: 0,
  st: "NÃO",
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function isTargetReached(
  result: ChannelResult,
  target: AutoPricingTarget
) {
  if (target.mode === "profit") {
    return result.grossProfit >= target.value;
  }

  return result.contributionMargin >= target.value;
}

function getMetricDifference(
  result: ChannelResult,
  target: AutoPricingTarget
) {
  if (target.mode === "profit") {
    return result.grossProfit - target.value;
  }

  return result.contributionMargin - target.value;
}

/**
 * Encontra o menor preço de venda que atinge a meta de lucro ou margem
 * usando busca binária sobre a lógica já existente da precificação manual.
 */
export function findSalePriceForTarget(
  product: Product,
  freight: number,
  channelName: string,
  target: AutoPricingTarget,
  options?: {
    minPrice?: number;
    maxPrice?: number;
    maxIterations?: number;
    tolerance?: number;
  }
): AutoPricingChannelResult | null {
  const minPrice = options?.minPrice ?? Math.max(product.cost, 1);
  const maxPrice = options?.maxPrice ?? Math.max(product.cost * 10, 10000);
  const maxIterations = options?.maxIterations ?? 60;
  const tolerance = options?.tolerance ?? 0.01;

  let low = minPrice;
  let high = maxPrice;
  let bestMatch: ChannelResult | null = null;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;

    const calculation = calculateBabyWorld(product, {
      salePrice: mid,
      freight,
      ...DEFAULT_INPUTS,
    });

    const channelResult = calculation.results.find(
      (item) => item.channel === channelName
    );

    if (!channelResult) {
      return null;
    }

    const diff = getMetricDifference(channelResult, target);

    if (Math.abs(diff) <= tolerance) {
      bestMatch = channelResult;
      break;
    }

    if (isTargetReached(channelResult, target)) {
      bestMatch = channelResult;
      high = mid;
    } else {
      low = mid;
    }
  }

  if (!bestMatch) {
    const fallbackCalculation = calculateBabyWorld(product, {
      salePrice: high,
      freight,
      ...DEFAULT_INPUTS,
    });

    bestMatch =
      fallbackCalculation.results.find((item) => item.channel === channelName) ?? null;
  }

  if (!bestMatch) {
    return null;
  }

  return {
    channel: bestMatch.channel,
    targetMode: target.mode,
    targetValue: target.value,
    salePrice: roundCurrency(bestMatch.salePrice),
    grossProfit: roundCurrency(bestMatch.grossProfit),
    contributionMargin: roundCurrency(bestMatch.contributionMargin),
    commissionValue: roundCurrency(bestMatch.commissionValue),
    marketplaceCredit: roundCurrency(bestMatch.marketplaceCredit),
    commissionRate: roundCurrency(bestMatch.commissionRate),
    shopeeFixedFee:
      bestMatch.shopeeFixedFee !== undefined
        ? roundCurrency(bestMatch.shopeeFixedFee)
        : undefined,
  };
}

/**
 * Calcula automaticamente o preço ideal para TODOS os canais da lógica Baby World.
 */
export function calculateAutoPricingForBabyWorld(
  product: Product,
  freight: number,
  target: AutoPricingTarget
): AutoPricingResult {
  const preview = calculateBabyWorld(product, {
    salePrice: Math.max(product.cost, 1),
    freight,
    ...DEFAULT_INPUTS,
  });

  const channels: AutoPricingChannelResult[] = preview.results
    .map((channel) =>
      findSalePriceForTarget(product, freight, channel.channel, target)
    )
    .filter((item): item is AutoPricingChannelResult => item !== null);

  const taxesPreview = calculateBabyWorld(product, {
    salePrice: channels[0]?.salePrice ?? Math.max(product.cost, 1),
    freight,
    ...DEFAULT_INPUTS,
  });

  return {
    freightUsed: freight,
    channels,
    taxes: taxesPreview.taxes,
  };
}