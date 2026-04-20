// Types for the pricing system

export type ProductSize = "pequeno" | "medio" | "grande" | "extra_grande";

export interface Product {
  id: string;
  sku: string;
  name: string;
  cost: number;
  icms: number;
  ipi: number;
  ncm: string;
  supplier?: string;
  porte: ProductSize;
}

// NCMs that use 12% ICMS de venda (instead of 18%)
export const NCM_12_PERCENT = [
  "94012000", "94017100", "94017900", "94018000", "94032090",
  "94037000", "94042900", "39269090", "42010090", "42029200",
  "84713012", "94049000", "95030010", "95030021", "95030022",
  "95030091", "95030097", "95030098", "95030099", "48189090",
];

// NCM isento de PIS/COFINS
export const NCM_ISENTO_PIS_COFINS = "49019900";

// ===== BABY WORLD CHANNELS =====
export interface BabyWorldChannel {
  name: string;
  commissionRate: number;
  shopeeFixedFee?: number;
  fixedFee?: number;
}

export const BABY_WORLD_CHANNELS: BabyWorldChannel[] = [
  { name: "MELI PREMIUM",  commissionRate: 0.165, fixedFee: 6 },
  { name: "MELI CLÁSSICO", commissionRate: 0.125, fixedFee: 6 },
  { name: "MAGALU",        commissionRate: 0.128 },
  { name: "AMAZON",        commissionRate: 0.13  },
  { name: "SHOPEE",        commissionRate: 0.14  },
  { name: "IFOOD",         commissionRate: 0.14  },
  { name: "VIA VAREJO",    commissionRate: 0.17  },
  { name: "SHEIN",         commissionRate: 0.16  },
  { name: "TIKTOK",        commissionRate: 0.15  },
  { name: "JAMBLE",        commissionRate: 0.14  },
  { name: "VENDA DIRETA",  commissionRate: 0.05  },
];

// ===== MP BABY STORE CHANNELS =====
export interface MpBabyStoreChannel {
  name: string;
  commissionRate: number;
  fixedFee?: number;
}

export const MP_BABY_STORE_CHANNELS: MpBabyStoreChannel[] = [
  { name: "MELI PREMIUM",  commissionRate: 0.165, fixedFee: 6 },
  { name: "MELI CLÁSSICO", commissionRate: 0.115, fixedFee: 6 },
  { name: "AMAZON",        commissionRate: 0.13  },
  { name: "SHOPEE",        commissionRate: 0.155 },
  { name: "SITE",          commissionRate: 0.105 },
  { name: "VENDA DIRETA",  commissionRate: 0     },
];

// ===== SITE / PDV CHANNELS (BABY WORLD) =====
export interface RetailChannel {
  name: string;
  commissionRate: number;
}

export const SITE_BABY_WORLD_CHANNELS: RetailChannel[] = [
  { name: "SITE BOLETO/PIX", commissionRate: 0.025  },
  { name: "1x CARTÃO",       commissionRate: 0.0599 },
  { name: "2x CARTÃO",       commissionRate: 0.0832 },
  { name: "3x CARTÃO",       commissionRate: 0.0891 },
  { name: "4x CARTÃO",       commissionRate: 0.0954 },
  { name: "5x CARTÃO",       commissionRate: 0.1014 },
  { name: "6x CARTÃO",       commissionRate: 0.1074 },
  { name: "7x CARTÃO",       commissionRate: 0.1126 },
  { name: "8x CARTÃO",       commissionRate: 0.1195 },
  { name: "9x CARTÃO",       commissionRate: 0.1263 },
  { name: "10x CARTÃO",      commissionRate: 0.1312 },
];

export const MERCADO_PAGO_CHANNELS: RetailChannel[] = [
  { name: "PIX",        commissionRate: 0.0549 },
  { name: "DÉBITO",     commissionRate: 0.0599 },
  { name: "CARTÃO 1X",  commissionRate: 0.0805 },
  { name: "CARTÃO 2X",  commissionRate: 0.0920 },
  { name: "CARTÃO 3X",  commissionRate: 0.1015 },
  { name: "CARTÃO 4X",  commissionRate: 0.1110 },
  { name: "CARTÃO 5X",  commissionRate: 0.1205 },
  { name: "CARTÃO 6X",  commissionRate: 0.1300 },
  { name: "CARTÃO 7X",  commissionRate: 0.1390 },
  { name: "CARTÃO 8X",  commissionRate: 0.1485 },
  { name: "CARTÃO 9X",  commissionRate: 0.1580 },
  { name: "CARTÃO 10X", commissionRate: 0.1675 },
];

export const ITAU_MACHINE_CHANNELS: RetailChannel[] = [
  { name: "PIX",        commissionRate: 0.0549 },
  { name: "DÉBITO",     commissionRate: 0.0579 },
  { name: "CARTÃO 1X",  commissionRate: 0.0822 },
  { name: "CARTÃO 2X",  commissionRate: 0.0927 },
  { name: "CARTÃO 3X",  commissionRate: 0.0997 },
  { name: "CARTÃO 4X",  commissionRate: 0.1067 },
  { name: "CARTÃO 5X",  commissionRate: 0.1137 },
  { name: "CARTÃO 6X",  commissionRate: 0.1207 },
  { name: "CARTÃO 7X",  commissionRate: 0.1287 },
  { name: "CARTÃO 8X",  commissionRate: 0.1357 },
  { name: "CARTÃO 9X",  commissionRate: 0.1427 },
  { name: "CARTÃO 10X", commissionRate: 0.1497 },
];

// Shopee tariff table
export const SHOPEE_TARIFFS = [
  { minPrice: 0,   rate: 0.20, fixedFee: 4  },
  { minPrice: 80,  rate: 0.14, fixedFee: 16 },
  { minPrice: 100, rate: 0.14, fixedFee: 20 },
  { minPrice: 200, rate: 0.14, fixedFee: 26 },
  { minPrice: 500, rate: 0.14, fixedFee: 26 },
];

export function getShopeeTariff(salePrice: number) {
  const sorted = [...SHOPEE_TARIFFS].sort((a, b) => a.minPrice - b.minPrice);
  let selected = sorted[0];
  for (const tariff of sorted) {
    if (salePrice >= tariff.minPrice) selected = tariff;
    else break;
  }
  return selected;
}

export function calculateShopeeCommission(salePrice: number) {
  const tariff = getShopeeTariff(salePrice);
  return salePrice * tariff.rate + tariff.fixedFee;
}

// ===== CHANNEL RESULT =====
export interface ChannelResult {
  channel: string;
  salePrice: number;
  commissionRate: number;
  commissionValue: number;
  marketplaceCredit: number;
  grossProfit: number;
  contributionMargin: number;
  shopeeFixedFee?: number;
  fixedFee?: number;
}

// ===== TAX CALCULATIONS (shared) =====
export interface TaxCalc {
  icmsVenda: number;
  ipiValue: number;
  creditoIcms: number;
  debitoIcms: number;
  pis: number;
  cofins: number;
  creditoPisCofins: number;
  creditoPis: number;
  creditoCofins: number;
  creditosIcmsFrete: number;
  creditosPisCofFrete: number;
  pisDebitoVenda: number;
  cofinsDebitoVenda: number;
  debitoPisCofins: number;
}

function getIcmsVendaRate(ncm: string): number {
  if (ncm === NCM_ISENTO_PIS_COFINS) return 0;
  const ncm8 = ncm.substring(0, 8);
  return NCM_12_PERCENT.includes(ncm8) ? 0.12 : 0.18;
}

function getPisRate(ncm: string): number {
  return ncm.substring(0, 8) === NCM_ISENTO_PIS_COFINS ? 0 : 0.0165;
}

function getCofinsRate(ncm: string): number {
  return ncm.substring(0, 8) === NCM_ISENTO_PIS_COFINS ? 0 : 0.076;
}

function getPisCofinsRate(ncm: string): number {
  return ncm.substring(0, 8) === NCM_ISENTO_PIS_COFINS ? 0 : 0.0925;
}

function calcTaxes(product: Product, salePrice: number, freight: number, commissionValue: number): TaxCalc {
  const icmsVenda = getIcmsVendaRate(product.ncm);
  const ipiValue = product.cost * product.ipi;
  const creditoIcms = product.cost * product.icms;
  const debitoIcms = salePrice * icmsVenda;
  const pis = getPisRate(product.ncm);
  const cofins = getCofinsRate(product.ncm);
  const creditoPisCofins = getPisCofinsRate(product.ncm);
  const creditoPis = (product.cost - creditoIcms) * pis;
  const creditoCofins = (product.cost - creditoIcms) * cofins;
  const icmsFrete = 0.12;
  const creditosIcmsFrete = freight * icmsFrete;
  const creditosPisCofFrete = (freight - creditosIcmsFrete) * creditoPisCofins;
  const pisDebitoVenda = (salePrice - debitoIcms) * pis;
  const cofinsDebitoVenda = (salePrice - debitoIcms) * cofins;
  const debitoPisCofins = creditoPis + creditoCofins - pisDebitoVenda - cofinsDebitoVenda;

  return {
    icmsVenda, ipiValue, creditoIcms, debitoIcms, pis, cofins,
    creditoPisCofins, creditoPis, creditoCofins, creditosIcmsFrete,
    creditosPisCofFrete, pisDebitoVenda, cofinsDebitoVenda, debitoPisCofins,
  };
}

// ===== BABY WORLD PRICING =====
export interface BabyWorldInputs {
  salePrice: number;
  freight: number;
  discountPercent: number;
  bonus: number;
  st: string;
}

function buildRetailCalculator(
  product: Product,
  inputs: BabyWorldInputs,
  channels: RetailChannel[],
  mode: "site" | "mercadopago" | "itau"
): { results: ChannelResult[]; taxes: TaxCalc } {
  const { salePrice, freight, discountPercent, bonus } = inputs;

  const results: ChannelResult[] = channels.map((ch, index) => {
    const commissionValue = salePrice * ch.commissionRate;
    const taxes = calcTaxes(product, salePrice, freight, commissionValue);

    const marketplaceCredit =
      commissionValue * taxes.creditoPisCofins +
      taxes.creditosIcmsFrete +
      taxes.creditosPisCofFrete;

    let saleBasis = salePrice;
    let discountValue = salePrice * discountPercent;
    let bonusValue = bonus;

    if (mode === "site") {
      if (index === 0) { discountValue = 0; bonusValue = bonus; }
      else if (index === 1) { discountValue = 0; bonusValue = bonus * (1 - discountPercent); }
      else { discountValue = salePrice * discountPercent; bonusValue = bonus * (1 - discountPercent); }
    }
    if (mode === "mercadopago") {
      if (index === 0 && discountPercent > 0) saleBasis = salePrice * (1 - discountPercent);
      discountValue = 0;
      bonusValue = bonus;
    }
    if (mode === "itau") {
      discountValue = salePrice * discountPercent;
      bonusValue = bonus * (1 - discountPercent);
    }

    const grossProfit =
      saleBasis - product.cost - taxes.ipiValue + taxes.creditoIcms
      - taxes.debitoIcms - freight - commissionValue - discountValue
      + taxes.debitoPisCofins + marketplaceCredit + bonusValue;

    const contributionMargin = saleBasis > 0 ? (grossProfit / saleBasis) * 100 : 0;

    return {
      channel: ch.name,
      salePrice: saleBasis,
      commissionRate: ch.commissionRate * 100,
      commissionValue,
      marketplaceCredit,
      grossProfit,
      contributionMargin,
    };
  });

  const taxes = calcTaxes(product, salePrice, freight, salePrice * channels[0].commissionRate);
  return { results, taxes };
}

export function calculateBabyWorld(
  product: Product,
  inputs: BabyWorldInputs,
  channels?: BabyWorldChannel[]
): { results: ChannelResult[]; taxes: TaxCalc } {
  const { salePrice, freight, discountPercent, bonus } = inputs;
  const menos79 = salePrice < 79 ? 6.75 : 0;

  const activeChannels = channels ?? BABY_WORLD_CHANNELS;

  const results: ChannelResult[] = activeChannels.map((ch) => {
    const isShopee = ch.name === "SHOPEE";
    const shopeeTariff = isShopee ? getShopeeTariff(salePrice) : null;

    const commissionValue = isShopee
      ? calculateShopeeCommission(salePrice)
      : salePrice * ch.commissionRate;

    const taxes = calcTaxes(product, salePrice, freight, commissionValue);

    const marketplaceCredit =
      commissionValue * taxes.creditoPisCofins +
      taxes.creditosIcmsFrete +
      taxes.creditosPisCofFrete;

    let grossProfit = 0;

    if (isShopee) {
      grossProfit =
        salePrice - product.cost - taxes.ipiValue + taxes.creditoIcms
        - taxes.debitoIcms - commissionValue - salePrice * discountPercent
        + taxes.debitoPisCofins + marketplaceCredit - freight + bonus - 1.97;
    } else {
      grossProfit =
        salePrice - product.cost - taxes.ipiValue + taxes.creditoIcms
        - taxes.debitoIcms - freight - commissionValue - salePrice * discountPercent
        + taxes.debitoPisCofins + marketplaceCredit + bonus - menos79;
    }

    const contributionMargin = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;

    return {
      channel: ch.name,
      salePrice,
      commissionRate: isShopee ? (shopeeTariff?.rate ?? 0) * 100 : ch.commissionRate * 100,
      commissionValue,
      marketplaceCredit,
      grossProfit,
      contributionMargin,
      shopeeFixedFee: isShopee ? (shopeeTariff?.fixedFee ?? 0) : undefined,
      fixedFee: !isShopee && ch.fixedFee ? ch.fixedFee : undefined,
    };
  });

  const taxes = calcTaxes(product, salePrice, freight, salePrice * 0.165);
  return { results, taxes };
}

export function calculateSiteBabyWorld(
  product: Product,
  inputs: BabyWorldInputs
): { results: ChannelResult[]; taxes: TaxCalc } {
  return buildRetailCalculator(product, inputs, SITE_BABY_WORLD_CHANNELS, "site");
}

export function calculateMercadoPagoMachine(
  product: Product,
  inputs: BabyWorldInputs
): { results: ChannelResult[]; taxes: TaxCalc } {
  return buildRetailCalculator(product, inputs, MERCADO_PAGO_CHANNELS, "mercadopago");
}

export function calculateItauMachine(
  product: Product,
  inputs: BabyWorldInputs
): { results: ChannelResult[]; taxes: TaxCalc } {
  return buildRetailCalculator(product, inputs, ITAU_MACHINE_CHANNELS, "itau");
}

// ===== MP BABY STORE PRICING =====
export interface MpBabyStoreInputs {
  salePrice: number;
  freight: number;
  others: number;
  bonus: number;
  st: string;
  menos79: number;
  taxPercent: number;
  icmsVenda: number;
}

export function calculateMpBabyStore(
  product: Product,
  inputs: MpBabyStoreInputs,
  channels?: MpBabyStoreChannel[]
): { results: ChannelResult[]; taxes: TaxCalc & { impostoR: number } } {
  const { salePrice, freight, others, bonus, menos79, taxPercent } = inputs;
  const impostoR = salePrice * taxPercent;

  const activeChannels = channels ?? MP_BABY_STORE_CHANNELS;

  const results: ChannelResult[] = activeChannels.map((ch) => {
    const isShopee = ch.name === "SHOPEE";
    const shopeeTariff = isShopee ? getShopeeTariff(salePrice) : null;

    const commissionRate = isShopee ? (shopeeTariff?.rate ?? 0) : ch.commissionRate;
    const commissionValue = isShopee
      ? calculateShopeeCommission(salePrice)
      : salePrice * commissionRate;

    const taxesBase = calcTaxes(product, salePrice, freight, commissionValue);
    const taxes = { ...taxesBase, debitoIcms: 0, impostoR };
    const marketplaceCredit = 0;

    let grossProfit = 0;
    if (isShopee) {
      grossProfit = salePrice - (product.cost + taxes.ipiValue) - freight
        - others - menos79 - commissionValue + bonus - impostoR - 5.97;
    } else {
      grossProfit = salePrice - (product.cost + taxes.ipiValue) - freight
        - others - menos79 - commissionValue + bonus - impostoR;
    }

    const contributionMargin = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;

    return {
      channel: ch.name,
      salePrice,
      commissionRate: isShopee ? (shopeeTariff?.rate ?? 0) * 100 : ch.commissionRate * 100,
      commissionValue,
      marketplaceCredit,
      grossProfit,
      contributionMargin,
      shopeeFixedFee: isShopee ? (shopeeTariff?.fixedFee ?? 0) : undefined,
      fixedFee: !isShopee && ch.fixedFee ? ch.fixedFee : undefined,
    };
  });

  const taxesBase = calcTaxes(product, salePrice, freight, salePrice * 0.165);
  const taxes = { ...taxesBase, debitoIcms: 0, impostoR };
  return { results, taxes };
}

export interface DashboardStats {
  totalProducts: number;
  mlListings: number;
  shopeeProducts: number;
  globalTax: number;
}

// ===== RUNTIME OVERRIDE (Firebase) =====
export function setBabyWorldChannels(channels: BabyWorldChannel[]) {
  BABY_WORLD_CHANNELS.splice(0, BABY_WORLD_CHANNELS.length, ...channels);
}

export function setMpBabyStoreChannels(channels: MpBabyStoreChannel[]) {
  MP_BABY_STORE_CHANNELS.splice(0, MP_BABY_STORE_CHANNELS.length, ...channels);
}