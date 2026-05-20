import { useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  AlertTriangle,
  Search,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Copy,
  Info,
  RefreshCw,
  Share2,
  Film,
  ExternalLink,
} from "lucide-react";

// ===== Tag Dictionary =====
type TagImpact = "positivo" | "negativo" | "neutro";

interface TagDictEntry {
  nome: string;
  impacto: TagImpact;
  descricao: string;
  acao?: string;
}

const TAG_DICTIONARY: Record<string, TagDictEntry> = {
  // POSITIVAS
  good_quality_thumbnail: { nome: "Foto Principal Aprovada", impacto: "positivo", descricao: "Sua foto principal tem boa qualidade e está aprovada pelo ML." },
  good_quality_picture: { nome: "Fotos Aprovadas", impacto: "positivo", descricao: "Suas fotos atendem aos critérios de qualidade do ML." },
  certified_quality_thumbnail: { nome: "Foto Principal Certificada", impacto: "positivo", descricao: "Foto principal com qualidade certificada pelo ML — máxima pontuação." },
  best_seller_candidate: { nome: "Candidato a Mais Vendido", impacto: "positivo", descricao: "Seu anúncio está com alto volume de vendas e pode receber o selo Mais Vendido." },
  catalog_boost: { nome: "Anúncio Impulsionado pelo ML", impacto: "positivo", descricao: "O Mercado Livre está impulsionando automaticamente este anúncio." },
  deal_of_the_day: { nome: "Oferta do Dia", impacto: "positivo", descricao: "Seu anúncio está participando da campanha Oferta do Dia." },
  lightning_deal: { nome: "Oferta Relâmpago", impacto: "positivo", descricao: "Anúncio participando de oferta relâmpago." },
  meli_choice_candidate: { nome: "Candidato Escolha do ML", impacto: "positivo", descricao: "Seu anúncio pode receber o selo Escolha do Mercado Livre." },
  brand_verified: { nome: "Marca Verificada", impacto: "positivo", descricao: "Sua marca foi verificada e aprovada pelo Mercado Livre." },
  shipping_discount_item: { nome: "Desconto de Frete Aplicado", impacto: "positivo", descricao: "Este anúncio está recebendo desconto especial no frete." },
  large_seller: { nome: "Grande Vendedor", impacto: "positivo", descricao: "Sua conta é classificada como grande vendedor — maior credibilidade." },
  medium_seller: { nome: "Vendedor Médio", impacto: "positivo", descricao: "Sua conta é classificada como vendedor médio." },
  medium_seller_advanced: { nome: "Vendedor Médio Avançado", impacto: "positivo", descricao: "Classificação avançada de vendedor médio." },
  brand: { nome: "Conta de Marca", impacto: "positivo", descricao: "Sua conta está registrada como marca oficial." },
  eshop: { nome: "Loja Oficial", impacto: "positivo", descricao: "Você possui uma loja oficial no Mercado Livre." },

  // NEGATIVAS
  poor_quality_thumbnail: { nome: "Foto Principal com Qualidade Ruim", impacto: "negativo", descricao: "Sua foto principal está com baixa qualidade — isso reduz sua exposição.", acao: "Substitua a foto principal por uma imagem de no mínimo 1200x1200px, fundo branco, produto ocupando 80% da imagem, sem marca d'água." },
  poor_quality_picture: { nome: "Fotos com Qualidade Ruim", impacto: "negativo", descricao: "Suas fotos estão abaixo do padrão exigido pelo ML.", acao: "Substitua as fotos por imagens de no mínimo 800x800px. Use fundo branco e boa iluminação." },
  unknown_quality_picture: { nome: "Qualidade das Fotos Desconhecida", impacto: "negativo", descricao: "O ML não conseguiu avaliar a qualidade das suas fotos.", acao: "Reenvie as fotos no formato JPG ou PNG, sem filtros e com boa resolução." },
  pictures_pending: { nome: "Fotos Pendentes de Aprovação", impacto: "negativo", descricao: "Suas fotos ainda estão sendo analisadas pelo ML.", acao: "Aguarde a aprovação ou substitua por fotos que atendam aos padrões." },
  incomplete_technical_specs: { nome: "Ficha Técnica Incompleta", impacto: "negativo", descricao: "Atributos obrigatórios da ficha técnica não foram preenchidos — reduz posicionamento.", acao: "Acesse o anúncio no ML e preencha todos os atributos obrigatórios da ficha técnica. Isso aumenta conversão e reduz perguntas dos compradores." },
  not_market_price: { nome: "Preço Fora da Média do Mercado", impacto: "negativo", descricao: "Seu preço está acima da média dos concorrentes para este produto.", acao: "Revise o preço do anúncio. Compare com outros vendedores e ajuste para ser competitivo." },
  only_html_description: { nome: "Descrição Apenas em HTML (Sem Texto)", impacto: "negativo", descricao: "Seu anúncio não possui descrição em texto — apenas código HTML.", acao: "Adicione uma descrição em texto corrido ao produto. Descreva características, benefícios e especificações técnicas." },
  moderation_penalty: { nome: "Penalidade de Moderação Ativa", impacto: "negativo", descricao: "Este anúncio recebeu uma penalidade do time de moderação do ML.", acao: "Acesse Central de Vendedores > Qualidade de anúncios e corrija o problema indicado pelo ML." },
  under_infractions: { nome: "Infração Ativa no Anúncio", impacto: "negativo", descricao: "Existe uma infração ativa que está prejudicando seu anúncio.", acao: "Acesse Minha Conta > Infrações no Mercado Livre e resolva a infração pendente." },
  catalog_forewarning: { nome: "Aviso de Catálogo Pendente", impacto: "negativo", descricao: "O ML solicitou que este anúncio seja vinculado ao catálogo.", acao: "Acesse o anúncio e vincule-o ao produto correspondente no catálogo do ML." },
  catalog_low_quality: { nome: "Baixa Qualidade no Catálogo", impacto: "negativo", descricao: "Seu anúncio está no catálogo mas com baixa pontuação de qualidade.", acao: "Melhore as fotos, preencha a ficha técnica completa e adicione uma boa descrição." },
  dragged_visits: { nome: "Visitas Arrastadas (Baixa Conversão)", impacto: "negativo", descricao: "Seu anúncio recebe visitas mas tem baixa taxa de conversão em vendas.", acao: "Revise preço, fotos e descrição. Verifique se o produto está competitivo em relação aos concorrentes." },
  dragged_bids_and_visits: { nome: "Visitas e Vendas em Queda", impacto: "negativo", descricao: "Seu anúncio está perdendo visitas e vendas simultaneamente.", acao: "Revise todos os elementos: título, fotos, preço e descrição. Considere campanhas de publicidade." },
  closed_by_contingency: { nome: "Anúncio Fechado por Contingência", impacto: "negativo", descricao: "O ML fechou este anúncio temporariamente por política interna.", acao: "Entre em contato com o suporte do Mercado Livre para entender e resolver o motivo." },
  fbm_in_process: { nome: "Processamento Fulfillment em Andamento", impacto: "negativo", descricao: "O envio via Fulfillment ML está em processamento.", acao: "Aguarde a conclusão do processamento. Se demorar mais de 48h, contate o suporte." },

  // NEUTRAS
  cart_eligible: { nome: "Elegível para Carrinho de Compras", impacto: "neutro", descricao: "Este anúncio pode ser adicionado ao carrinho de compras — funcionamento padrão do ML." },
  immediate_payment: { nome: "Pagamento via Mercado Pago", impacto: "neutro", descricao: "Pagamento obrigatório via Mercado Pago — padrão para todos os anúncios brasileiros." },
  user_product_seller: { nome: "Vendedor de Produtos", impacto: "neutro", descricao: "Classificação interna do ML — indica que você é um vendedor de produtos físicos." },
  messages_as_seller: { nome: "Canal de Mensagens Ativo", impacto: "neutro", descricao: "Você está habilitado a receber mensagens de compradores." },
  normal: { nome: "Status Normal", impacto: "neutro", descricao: "Conta sem restrições especiais — status padrão." },
  business: { nome: "Conta Empresarial", impacto: "neutro", descricao: "Sua conta está cadastrada como pessoa jurídica." },
  credits_profile: { nome: "Perfil de Crédito", impacto: "neutro", descricao: "Sua conta possui perfil de crédito avaliado pelo ML." },
  standard_price_by_channel: { nome: "Preço Padrão por Canal", impacto: "neutro", descricao: "Preço configurado de forma padrão para este canal de venda." },
  extended_warranty_eligible: { nome: "Elegível para Garantia Estendida", impacto: "neutro", descricao: "Este produto pode ser elegível para garantia estendida do ML." },
  warehouse_management: { nome: "Gestão de Estoque Ativa", impacto: "neutro", descricao: "Estoque sendo gerenciado pelo sistema do ML." },
  fulfillment: { nome: "Fulfillment (Full ML)", impacto: "neutro", descricao: "Produto gerenciado pelo Fulfillment do Mercado Livre." },
  shipping_guaranteed: { nome: "Envio Garantido", impacto: "neutro", descricao: "Envio com garantia do Mercado Livre." },
  catalog: { nome: "Vinculado ao Catálogo", impacto: "neutro", descricao: "Anúncio vinculado ao catálogo ML." },
  free_relist: { nome: "Reanúncio Gratuito Disponível", impacto: "neutro", descricao: "Este anúncio pode ser reanunciado gratuitamente." },
  loyalty_discount_item: { nome: "Desconto Meli+", impacto: "neutro", descricao: "Anúncio com desconto para clientes do programa Meli+." },
  listing_exposed_in_pdp: { nome: "Exposto na Página do Produto", impacto: "neutro", descricao: "Este anúncio aparece na página de detalhes do catálogo ML." },
  compats_eligible: { nome: "Elegível para Compatibilidades", impacto: "neutro", descricao: "Compatível com o sistema de compatibilidades do ML." },
  not_eligible_for_cart: { nome: "Não Elegível para Carrinho", impacto: "neutro", descricao: "Este anúncio não pode ser adicionado ao carrinho." },
};

const getTagInfo = (tagName: string): TagDictEntry =>
  TAG_DICTIONARY[tagName] ?? {
    nome: tagName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    impacto: "neutro" as const,
    descricao: "Tag de uso interno do Mercado Livre.",
  };

const SELLER_TAG_FRIENDLY: Record<string, string> = {
  brand: "Marca Oficial",
  large_seller: "Grande Vendedor",
  medium_seller: "Vendedor Médio",
  medium_seller_advanced: "Vendedor Médio Avançado",
  international_seller: "Vendedor Internacional",
  ngo: "ONG",
};

// ===== Cálculo de Repasse =====
const calcularRepasse = (
  preco: number,
  listingType: string,
  freteGratis: boolean,
  logisticType: string
) => {
  const percentualComissao = listingType === "gold_special" ? 0.115 : 0.165;
  const comissao = preco * percentualComissao;

  let taxaFixa = 0;
  if (preco < 12.5) taxaFixa = preco * 0.5;
  else if (preco < 20.0) taxaFixa = 5.5;
  else if (preco < 50.0) taxaFixa = 6.65;
  else if (preco < 79.0) taxaFixa = 6.75;

  let custoFrete = 0;
  if (freteGratis && preco >= 79) {
    if (logisticType === "fulfillment") {
      if (preco < 150) custoFrete = 12.0;
      else if (preco < 300) custoFrete = 15.0;
      else custoFrete = 18.0;
    } else {
      if (preco < 150) custoFrete = 9.5;
      else if (preco < 300) custoFrete = 13.0;
      else custoFrete = 16.0;
    }
  }

  const repasse = preco - comissao - taxaFixa - custoFrete;
  return { comissao, taxaFixa, custoFrete, repasse, percentualComissao };
};

// ===== Helper Functions =====

function getListingTypeLabel(typeId: string): string {
  const map: Record<string, string> = {
    gold_pro: "Premium",
    gold_special: "Clássico",
    gold_premium: "Diamante",
    free: "Grátis",
  };
  return map[typeId] ?? typeId;
}

function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getListingAge(dateCreated: string): { months: number; formatted: string } {
  try {
    const created = new Date(dateCreated);
    const now = new Date();
    const months =
      (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    return { months, formatted: created.toLocaleDateString("pt-BR") };
  } catch {
    return { months: 0, formatted: "—" };
  }
}

function parseSize(sizeStr: string | undefined): { w: number; h: number } {
  if (!sizeStr) return { w: 0, h: 0 };
  const parts = sizeStr.split("x");
  return { w: parseInt(parts[0] ?? "0", 10) || 0, h: parseInt(parts[1] ?? "0", 10) || 0 };
}

function classifyPhoto(sizeStr: string | undefined): "excellent" | "good" | "average" | "poor" {
  const { w, h } = parseSize(sizeStr);
  if (w >= 1200 || h >= 1200) return "excellent";
  if (w >= 800 || h >= 800) return "good";
  if (w >= 500 || h >= 500) return "average";
  return "poor";
}

function getPictureUrl(p: Record<string, unknown>): string {
  return ((p.secure_url ?? p.url) as string) ?? "";
}

function getAttrObrigatoriedade(attr: Record<string, unknown>): "required" | "hidden" | "common" {
  const t = attr.tags as Record<string, unknown> | string[] | undefined;
  if (!t) return "common";
  if (Array.isArray(t)) {
    if (t.includes("required")) return "required";
    if (t.includes("hidden")) return "hidden";
    return "common";
  }
  if (typeof t === "object") {
    if ("required" in t) return "required";
    if ("hidden" in t) return "hidden";
  }
  return "common";
}

function getAttrIsImportant(attr: Record<string, unknown>): boolean {
  const t = attr.tags as Record<string, unknown> | string[] | undefined;
  if (!t) return false;
  if (Array.isArray(t)) return t.includes("important");
  if (typeof t === "object") return "important" in t;
  return false;
}

function getCatalogStatus(item: Record<string, unknown>): { label: string; color: string } {
  const catalogListing = item.catalog_listing as boolean | undefined;
  const winnerId = item.winner_item_id as string | undefined;
  const itemId = item.id as string;
  if (!catalogListing) return { label: "❌ Fora do catálogo", color: "text-red-400" };
  if (winnerId === itemId) return { label: "✅ GANHANDO no catálogo", color: "text-green-400" };
  if (winnerId)
    return {
      label: "⚠️ PERDENDO no catálogo (outro vendedor é o ganhador)",
      color: "text-yellow-400",
    };
  return { label: "📋 No catálogo", color: "text-blue-400" };
}

function parseClipResponse(text: string): {
  soraPrompt: string;
  dicasGravacao: string;
  roteiro: string;
} {
  const section1 = text.match(/PROMPT PARA O KLING AI[^\n]*([\s\S]*?)(?=\nROTEIRO DO V|$)/i);
  const section2 = text.match(/ROTEIRO DO V[ÍI]DEO[^\n]*([\s\S]*?)(?=\nDICAS PARA GRAVAR|$)/i);
  const section3 = text.match(/DICAS PARA GRAVAR[^\n]*([\s\S]*?)$/i);
  return {
    soraPrompt: section1?.[1]?.trim() ?? text.trim(),
    roteiro: section2?.[1]?.trim() ?? "",
    dicasGravacao: section3?.[1]?.trim() ?? "",
  };
}

// ===== Sub-components =====

function ScoreGauge({ score }: { score: number }) {
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circumference = Math.PI * r;
  const dash = Math.max(0, Math.min(1, score / 100)) * circumference;
  const color = score > 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  return (
    <svg viewBox="0 0 160 90" className="w-44">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`}
        fill="none"
        stroke="#374151"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="28" fontWeight="bold" fontFamily="sans-serif">
        {score}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="sans-serif">
        /100
      </text>
    </svg>
  );
}

function BucketCard({ label, score }: { label: string; score: number }) {
  const colorClass =
    score > 80
      ? "text-green-400 border-green-500/30 bg-green-500/10"
      : score >= 50
      ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
      : "text-red-400 border-red-500/30 bg-red-500/10";
  return (
    <div className={`rounded-xl border p-4 text-center ${colorClass}`}>
      <p className="text-3xl font-bold">{score}%</p>
      <p className="text-xs mt-1.5 font-semibold opacity-80 leading-tight">{label}</p>
    </div>
  );
}

function QualityCard({ label, score }: { label: string; score: number }) {
  const color = score > 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, score / 100)) * circumference;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#374151" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 36 36)"
        />
        <text
          x="36"
          y="36"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="13"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          {score}%
        </text>
      </svg>
      <p
        className="text-xs font-semibold text-muted-foreground text-center leading-tight"
        style={{ maxWidth: 72 }}
      >
        {label}
      </p>
    </div>
  );
}

async function mlFetch(url: string, headers: HeadersInit): Promise<Response> {
  try {
    return await fetch(url, { headers });
  } catch {
    return fetch(`https://corsproxy.io/?${url}`, { headers });
  }
}

// ===== Main Component =====

export default function MercadoLivreDiagnostico() {
  const [mlbInput, setMlbInput] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [showManualToken, setShowManualToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemData, setItemData] = useState<Record<string, unknown> | null>(null);
  const [sellerData, setSellerData] = useState<Record<string, unknown> | null>(null);
  const [attributes, setAttributes] = useState<Record<string, unknown>[]>([]);
  const [description, setDescription] = useState("");
  const [performanceData, setPerformanceData] = useState<Record<string, unknown> | null>(null);
  const [saleFeeData, setSaleFeeData] = useState<{ rate: number; amount: number } | null>(null);
  const [videosData, setVideosData] = useState<Record<string, unknown>[] | null>(null);
  const [aiDescription, setAiDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [clipPromptLoading, setClipPromptLoading] = useState(false);
  const [clipPromptResult, setClipPromptResult] = useState<{
    soraPrompt: string;
    dicasGravacao: string;
    roteiro: string;
  } | null>(null);
  const [showClipResult, setShowClipResult] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [downloadingPhotos, setDownloadingPhotos] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<Record<string, unknown>[] | null>(null);
  const [showSecondaryAttrs, setShowSecondaryAttrs] = useState(false);
  const { toast } = useToast();

  async function getValidToken(): Promise<string> {
    if (manualToken.trim()) return manualToken.trim();

    const clientId = import.meta.env.VITE_ML_CLIENT_ID as string | undefined;
    const clientSecret = import.meta.env.VITE_ML_CLIENT_SECRET as string | undefined;
    if (!clientId || !clientSecret) {
      setShowManualToken(true);
      throw new Error(
        "Credenciais não configuradas. Cole seu token de acesso abaixo para continuar."
      );
    }

    const storedToken = localStorage.getItem("ml_access_token");
    const storedTimestamp = localStorage.getItem("ml_token_timestamp");
    if (storedToken && storedTimestamp) {
      const elapsed = (Date.now() - parseInt(storedTimestamp, 10)) / 1000;
      if (elapsed < 18000) return storedToken;
    }

    try {
      const res = await fetch(
        "https://corsproxy.io/?https://api.mercadolibre.com/oauth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        }
      );
      if (!res.ok) {
        setShowManualToken(true);
        throw new Error(
          "Falha ao gerar token automático. Cole seu token de acesso abaixo para continuar."
        );
      }
      const data = await res.json();
      const token = data.access_token as string;
      localStorage.setItem("ml_access_token", token);
      localStorage.setItem("ml_token_timestamp", String(Date.now()));
      return token;
    } catch (err) {
      setShowManualToken(true);
      throw err instanceof Error
        ? err
        : new Error("Falha ao gerar token. Cole seu token manualmente.");
    }
  }

  async function handleAnalyze() {
    const id = mlbInput.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setError(null);
    setItemData(null);
    setSellerData(null);
    setAttributes([]);
    setDescription("");
    setPerformanceData(null);
    setSaleFeeData(null);
    setVideosData(null);
    setAiDescription("");
    setClipPromptResult(null);
    setShowClipResult(false);
    setSelectedPhoto(null);
    setGalleryIdx(0);
    setShippingOptions(null);
    setShowSecondaryAttrs(false);

    try {
      const token = await getValidToken();
      const authHeaders = { Authorization: `Bearer ${token}` };

      const itemRes = await fetch(
        `https://corsproxy.io/?https://api.mercadolibre.com/items/${id}`,
        { headers: authHeaders }
      );
      if (itemRes.status === 404) throw new Error("Anúncio não encontrado. Verifique o código MLB.");
      if (!itemRes.ok) throw new Error(`Erro ao buscar anúncio (${itemRes.status}).`);
      const item = await itemRes.json();

      const [attrRes, descRes, sellerRes, perfRes, feesRes, videosRes] = await Promise.all([
        mlFetch(`https://api.mercadolibre.com/items/${id}/attributes`, authHeaders),
        mlFetch(`https://api.mercadolibre.com/items/${id}/description`, authHeaders),
        mlFetch(`https://api.mercadolibre.com/users/${item.seller_id}`, authHeaders),
        mlFetch(`https://api.mercadolibre.com/items/${id}/performance`, authHeaders).catch(() => null),
        mlFetch(`https://api.mercadolibre.com/items/${id}/sale_fees`, authHeaders).catch(() => null),
        mlFetch(`https://api.mercadolibre.com/items/${id}/videos`, authHeaders).catch(() => null),
      ]);

      const attrs = attrRes.ok ? await attrRes.json() : [];
      const descJson = descRes.ok ? await descRes.json() : {};
      const seller = sellerRes.ok ? await sellerRes.json() : {};

      try {
        if (perfRes && perfRes.ok) {
          const perf = await perfRes.json();
          setPerformanceData(perf);
        }
      } catch { /* ignore */ }

      try {
        if (feesRes && feesRes.ok) {
          const feesText = await feesRes.text();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const feesRaw: any = JSON.parse(feesText);
          const rate: number | null = feesRaw?.[0]?.sale_fee_rate ?? feesRaw?.sale_fee_rate ?? null;
          const amount: number | null =
            feesRaw?.[0]?.sale_fee_amount ?? feesRaw?.sale_fee_amount ?? null;
          if (rate != null && amount != null) setSaleFeeData({ rate, amount });
        }
      } catch { /* ignore */ }

      try {
        if (videosRes && videosRes.ok) {
          const vids = await videosRes.json();
          setVideosData(Array.isArray(vids) ? vids : []);
        } else {
          setVideosData([]);
        }
      } catch {
        setVideosData([]);
      }

      // Fetch real shipping options from depot CEP 37644-020 (Extrema, MG)
      try {
        const originZip = "37644020";
        const shippingOptUrl = `https://api.mercadolibre.com/items/${id}/shipping_options?zip_code=${originZip}`;
        let shippingOptRes: Response | null = null;
        try {
          shippingOptRes = await fetch(`https://corsproxy.io/?${shippingOptUrl}`, { headers: authHeaders });
        } catch { /* cors fallback */ }
        if (!shippingOptRes || !shippingOptRes.ok) {
          try {
            shippingOptRes = await fetch(
              `https://api.allorigins.win/raw?url=${encodeURIComponent(shippingOptUrl)}`,
              { headers: authHeaders }
            );
          } catch { /* both failed */ }
        }
        if (shippingOptRes && shippingOptRes.ok) {
          const raw = await shippingOptRes.json();
          const opts =
            raw?.shipping_options ??
            raw?.options ??
            (Array.isArray(raw) ? raw : null);
          setShippingOptions(opts ?? []);
        } else {
          setShippingOptions([]);
        }
      } catch {
        setShippingOptions([]);
      }

      setItemData(item);
      setSellerData(seller);
      setAttributes(Array.isArray(attrs) ? attrs : []);
      setDescription(descJson.plain_text ?? descJson.text ?? "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao buscar dados.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleImproveDescription() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey) {
      toast({
        title: "API Key não configurada",
        description: "Configure VITE_ANTHROPIC_API_KEY no arquivo .env para usar análise com IA.",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);
    try {
      const titulo = (itemData?.title as string) ?? "";
      const categoryId = (itemData?.category_id as string) ?? "";
      const preco = formatPrice((itemData?.price as number) ?? 0);
      const descricaoAtual = description || "(sem descrição)";
      const atributosRelevantes = attributes
        .filter((a) => a.value_name != null)
        .map((a) => `${a.name as string}: ${a.value_name as string}`)
        .join(", ");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `IMPORTANTE: Não use emojis, não use # para títulos, não use * para negrito/itálico. Use apenas texto limpo com letras MAIÚSCULAS para destacar seções e títulos. Separe seções com uma linha em branco.

Você é um especialista em copywriting para e-commerce brasileiro com foco em Mercado Livre.

PRODUTO: ${titulo}
CATEGORIA: ${categoryId}
PREÇO: R$ ${preco}
DESCRIÇÃO ATUAL: ${descricaoAtual}
ATRIBUTOS DO PRODUTO: ${atributosRelevantes}

Sua tarefa é criar uma descrição EXCEPCIONAL para este anúncio do Mercado Livre seguindo estas regras:

1. ESTRUTURA OBRIGATÓRIA:
   - Headline impactante em MAIÚSCULAS (1 linha)
   - Parágrafo de abertura com o principal benefício (2-3 linhas)
   - Seção "POR QUE ESCOLHER ESTE PRODUTO?" com 4-6 bullet points dos diferenciais
   - Seção "ESPECIFICAÇÕES TÉCNICAS" com todas as medidas e dados técnicos
   - Seção "O QUE ESTÁ INCLUÍDO"
   - Seção "GARANTIA E SUPORTE"
   - CTA final persuasivo

2. REGRAS DE COPYWRITING:
   - Use linguagem persuasiva mas verdadeira
   - Destaque benefícios, não apenas características
   - Inclua palavras-chave naturais que compradores pesquisam
   - Seja específico com números e medidas
   - Antecipe as principais dúvidas dos compradores
   - Tom profissional mas acessível para o público brasileiro

3. SEO PARA ML:
   - Use termos que compradores realmente pesquisam
   - Inclua variações do nome do produto naturalmente

Retorne APENAS a descrição final, formatada e pronta para uso, sem explicações adicionais.`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? `Erro ${res.status} na API.`
        );
      }

      const data = await res.json();
      const improved = (data.content?.[0]?.text as string) ?? "";
      setAiDescription(improved);
    } catch (err: unknown) {
      toast({
        title: "Erro ao chamar IA",
        description: err instanceof Error ? err.message : "Erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGenerateClipPrompt() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey) {
      toast({
        title: "API Key não configurada",
        description: "Configure VITE_ANTHROPIC_API_KEY no arquivo .env para usar esta função.",
        variant: "destructive",
      });
      return;
    }

    if (!itemData) return;

    setClipPromptLoading(true);
    setShowClipResult(true);
    try {
      const titulo = (itemData.title as string) ?? "";
      const categoryId = (itemData.category_id as string) ?? "";
      const descricaoBase = description.slice(0, 200) || "(sem descrição)";

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `Você é um especialista em criação de vídeos curtos para e-commerce. Crie um roteiro de vídeo para o Kling AI sobre o produto abaixo.

REGRAS OBRIGATÓRIAS:
- Vídeo de 10 a 15 segundos
- NÃO mencionar preço em nenhum momento
- Tom humanizado, natural, como se uma pessoa real estivesse usando o produto
- Sem textos promocionais exagerados
- Focar no uso real do produto no dia a dia
- O prompt final para o Kling deve ter NO MÁXIMO 2500 caracteres

Produto: ${titulo}
Categoria: ${categoryId}
Descrição: ${descricaoBase}

Retorne em 3 seções com texto limpo, sem emojis, sem # e sem *:

PROMPT PARA O KLING AI (em inglês, máximo 2500 caracteres, pronto para colar):
[prompt aqui]

ROTEIRO DO VÍDEO (em português, cena por cena, 10-15 segundos):
[roteiro aqui]

DICAS PARA GRAVAR COM CELULAR (caso prefira gravar você mesmo):
[dicas aqui]`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? `Erro ${res.status} na API.`
        );
      }

      const data = await res.json();
      const rawText = (data.content?.[0]?.text as string) ?? "";
      setClipPromptResult(parseClipResponse(rawText));
    } catch (err: unknown) {
      toast({
        title: "Erro ao gerar ideia de clip",
        description: err instanceof Error ? err.message : "Erro desconhecido.",
        variant: "destructive",
      });
      setShowClipResult(false);
    } finally {
      setClipPromptLoading(false);
    }
  }

  async function handleDownloadPhotos() {
    setDownloadingPhotos(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("fotos_ml");
      folder?.file(
        "instrucoes_otimizacao.txt",
        "Para otimizar suas fotos:\n1) Use fundo branco\n2) Resolução mínima 1200x1200px\n3) Formato JPG ou PNG\n4) Sem marca d'água\n5) Produto ocupando 80% da imagem"
      );
      await Promise.all(
        pictures.map(async (pic, idx) => {
          const url = getPictureUrl(pic);
          if (!url) return;
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            folder?.file(`foto_${String(idx + 1).padStart(2, "0")}.jpg`, blob);
          } catch { /* skip failed photo */ }
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `fotos_${mlbInput.trim().toUpperCase()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast({ title: "Erro ao baixar fotos", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setDownloadingPhotos(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
  }

  function copyDiagnosticSummary() {
    if (!itemData) return;
    const id = (itemData.id as string) ?? "";
    const titulo = (itemData.title as string) ?? "";
    const tipo = getListingTypeLabel(listingType);
    const score = apiScore !== undefined ? `${apiScore}/100` : "N/D";
    const negativeTags = tags.filter((t) => getTagInfo(t).impacto === "negativo");
    const problemasStr =
      negativeTags.length > 0
        ? negativeTags.map((t) => getTagInfo(t).nome).join(", ")
        : "Nenhum";
    const acoesStr =
      negativeTags.length > 0
        ? negativeTags
            .filter((t) => getTagInfo(t).acao)
            .map((t) => `• ${getTagInfo(t).acao}`)
            .join("\n")
        : "Nenhuma ação necessária";
    const summary = `Diagnóstico ${id} — ${titulo}
Score: ${score}
Tipo: ${tipo} | Preço: R$ ${formatPrice(displayPrice)} | Repasse: R$ ${formatPrice(repasseAmount)}
Problemas encontrados: ${problemasStr}
Ações necessárias:
${acoesStr}`;
    copyText(summary);
  }

  // ---- Derived values ----
  const tags = (itemData?.tags as string[]) ?? [];
  const pictures = (itemData?.pictures as Record<string, unknown>[]) ?? [];
  const sellerTags = (sellerData?.tags as string[]) ?? [];

  const photoQuality = {
    excellent: pictures.filter((p) => classifyPhoto(p.size as string) === "excellent").length,
    good: pictures.filter((p) => classifyPhoto(p.size as string) === "good").length,
    average: pictures.filter((p) => classifyPhoto(p.size as string) === "average").length,
    poor: pictures.filter((p) => classifyPhoto(p.size as string) === "poor").length,
  };
  const hasLowQualityPhotos = photoQuality.average + photoQuality.poor > 0;

  const attrFilled = attributes.filter((a) => a.value_name != null).length;
  const requiredAttrs = attributes.filter((a) => getAttrObrigatoriedade(a) === "required");
  const requiredFilled = requiredAttrs.filter((a) => a.value_name != null).length;
  const requiredPending = requiredAttrs.length - requiredFilled;

  const apiScore = performanceData?.score as number | undefined;
  const buckets = performanceData?.buckets as Record<string, { score: number }> | undefined;
  const bucketPictures = buckets?.PICTURES?.score ?? null;
  const bucketChars = buckets?.CHARACTERISTICS?.score ?? null;
  const bucketDesc = buckets?.DESCRIPTION?.score ?? null;
  const bucketSales = buckets?.SALES?.score ?? null;
  const bucketValues = [bucketPictures, bucketChars, bucketDesc, bucketSales].filter(
    (v): v is number => v != null
  );
  const avgBucket =
    bucketValues.length > 0
      ? Math.round(bucketValues.reduce((a, b) => a + b, 0) / bucketValues.length)
      : null;

  const salePrice = (itemData?.sale_price as Record<string, unknown>)?.amount as number | undefined;
  const displayPrice = salePrice ?? ((itemData?.price as number) ?? 0);
  const listingType = (itemData?.listing_type_id as string) ?? "";
  const shipping = itemData?.shipping as Record<string, unknown> | undefined;
  const freeShipping = shipping?.free_shipping as boolean | undefined;
  const shippingCost = shipping?.cost as number | null | undefined;
  const isFulfillment = (shipping?.logistic_type as string) === "fulfillment";
  const logisticType = (shipping?.logistic_type as string) ?? "";

  const {
    comissao: estimatedComissao,
    taxaFixa,
    custoFrete,
    percentualComissao,
  } = calcularRepasse(displayPrice, listingType, freeShipping === true, logisticType);

  const effectiveCommissionRate = saleFeeData?.rate ?? percentualComissao;
  const effectiveCommissionAmount = saleFeeData?.amount ?? estimatedComissao;
  const repasseAmount = displayPrice - effectiveCommissionAmount - taxaFixa - custoFrete;

  const sellerAddress = itemData?.seller_address as Record<string, unknown> | undefined;
  const cityName = ((sellerAddress?.city as Record<string, unknown>)?.name as string) ?? "";
  const stateName = ((sellerAddress?.state as Record<string, unknown>)?.name as string) ?? "";
  const locationStr = [cityName, stateName].filter(Boolean).join(", ") || "—";

  const itemStatus = itemData?.status as string | undefined;
  const statusLabel =
    itemStatus === "active"
      ? "Ativo"
      : itemStatus === "paused"
      ? "Pausado"
      : itemStatus === "closed"
      ? "Fechado"
      : (itemStatus ?? "—");
  const catalogStatus = itemData ? getCatalogStatus(itemData) : null;
  const listingAge = itemData?.date_created
    ? getListingAge(itemData.date_created as string)
    : null;

  const title = (itemData?.title as string) ?? "";
  const titleLen = title.length;
  const hasMeasures = /\d+\s*(cm|mm|kg|g\b|litros?|ml|pol|polegadas?|"|m\b)/i.test(title);
  const brandAttr = attributes.find((a) => a.id === "BRAND");
  const brandName = (brandAttr?.value_name as string) ?? "";
  const titleHasBrand = brandName ? title.toLowerCase().includes(brandName.toLowerCase()) : false;

  const negativeTags = tags.filter((t) => getTagInfo(t).impacto === "negativo");
  const positiveTags = tags.filter((t) => getTagInfo(t).impacto === "positivo");
  const neutralTags = tags.filter((t) => getTagInfo(t).impacto === "neutro");

  const hasVideos = videosData !== null && videosData.length > 0;

  // Description metrics
  const descWords = description.trim() ? description.trim().split(/\s+/).length : 0;
  const aiDescWords = aiDescription.trim() ? aiDescription.trim().split(/\s+/).length : 0;

  // Attribute groups
  const nonRequiredVisibleAttrs = attributes.filter(a => {
    const o = getAttrObrigatoriedade(a);
    return o !== "required" && o !== "hidden";
  });
  const importantAttrs = nonRequiredVisibleAttrs.filter((a, i) => getAttrIsImportant(a) || i < 5);
  const secondaryAttrsAll = nonRequiredVisibleAttrs.filter((a, i) => !getAttrIsImportant(a) && i >= 5);
  const importantFilled = importantAttrs.filter(a => a.value_name != null).length;
  const secondaryFilled = secondaryAttrsAll.filter(a => a.value_name != null).length;
  const totalPending = [...requiredAttrs, ...importantAttrs, ...secondaryAttrsAll].filter(
    a => a.value_name == null
  ).length;

  // Regulatory attributes
  const regulatoryAttrs = attributes.filter(a => {
    const id = ((a.id as string) ?? "").toUpperCase();
    const name = ((a.name as string) ?? "").toLowerCase();
    return (
      id.includes("INMETRO") || id.includes("CERTIFICATION") || id.includes("ANVISA") ||
      id.includes("ANATEL") || id.includes("ANEEL") || id.includes("REGISTRO") ||
      name.includes("certificação") || name.includes("registro") ||
      name.includes("homologação") || name.includes("certificado")
    );
  });

  // Purchase experience checks
  const experienceChecks: { label: string; ok: boolean; group: string }[] = [
    { label: "Frete grátis para o comprador", ok: freeShipping === true, group: "Entrega" },
    { label: "Full/Fulfillment ML", ok: isFulfillment, group: "Entrega" },
    { label: "Mais de uma opção de envio", ok: (shippingOptions?.length ?? 0) > 1, group: "Entrega" },
    { label: "Mais de 8 fotos", ok: pictures.length > 8, group: "Anúncio" },
    { label: "Foto principal aprovada (tag ML)", ok: tags.includes("good_quality_thumbnail"), group: "Anúncio" },
    { label: "Possui vídeo/clip", ok: hasVideos, group: "Anúncio" },
    { label: "Título entre 60–80 caracteres", ok: titleLen >= 60 && titleLen <= 80, group: "Anúncio" },
    { label: "Descrição com mais de 200 caracteres", ok: description.length > 200, group: "Anúncio" },
    { label: "Ficha técnica: obrigatórios preenchidos", ok: requiredAttrs.length > 0 && requiredFilled === requiredAttrs.length, group: "Anúncio" },
    { label: "Anúncio ativo", ok: itemStatus === "active", group: "Vendedor" },
    { label: "Catálogo ativo", ok: (itemData?.catalog_listing as boolean) === true, group: "Vendedor" },
  ];
  const experienceScore = experienceChecks.filter(c => c.ok).length;
  const experienceTotal = experienceChecks.length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Diagnóstico de Anúncio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Analise a qualidade do seu anúncio no Mercado Livre
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder="Digite o código MLB (ex: MLB2696457095)"
              value={mlbInput}
              onChange={(e) => setMlbInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={loading || !mlbInput.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Analisar
            </Button>
            {itemData && !loading && (
              <Button
                variant="outline"
                onClick={handleAnalyze}
                disabled={loading}
                title="Reanalisar"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reanalisar
              </Button>
            )}
          </div>

          {/* Manual token fallback */}
          {showManualToken && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 space-y-3">
              <p className="text-sm text-yellow-400 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Token automático não disponível. Cole seu access token abaixo para continuar.
              </p>
              <p className="text-xs text-muted-foreground">
                Obtenha o token em:{" "}
                <span className="font-mono text-primary">
                  https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
                </span>
                {" "}→ seção "Obtendo credenciais de aplicação".
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Cole aqui: APP_USR-... ou Bearer ..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setShowManualToken(false);
                    setError(null);
                    handleAnalyze();
                  }}
                  disabled={!manualToken.trim()}
                >
                  Usar Token
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Env vars warning */}
      {(!import.meta.env.VITE_ML_CLIENT_ID || !import.meta.env.VITE_ML_CLIENT_SECRET) && !showManualToken && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-yellow-400 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Configure VITE_ML_CLIENT_ID e VITE_ML_CLIENT_SECRET no arquivo .env, ou use o campo
              de token manual que aparece ao tentar analisar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-6">
            <p className="text-red-400 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {itemData && !loading && (
        <>
          {/* Copy summary button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={copyDiagnosticSummary}>
              <Share2 className="h-4 w-4 mr-2" />
              Copiar Resumo
            </Button>
          </div>

          {/* === QUALIDADE DO ANÚNCIO (Score API) === */}
          {performanceData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Qualidade do Anúncio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 items-start">
                  {apiScore !== undefined && <QualityCard label="QUALIDADE MELI" score={apiScore} />}
                  {bucketPictures !== null && <QualityCard label="IMAGENS" score={bucketPictures} />}
                  {bucketChars !== null && <QualityCard label="FICHA TÉCNICA" score={bucketChars} />}
                  {bucketDesc !== null && <QualityCard label="DESCRIÇÃO" score={bucketDesc} />}
                  {avgBucket !== null && <QualityCard label="QUALIDADE GERAL" score={avgBucket} />}
                </div>
              </CardContent>
            </Card>
          )}

          {/* === SUMMARY CARDS === */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Qualidade das Fotos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-green-400 font-semibold">{photoQuality.excellent}</span> excelentes</p>
                <p><span className="text-blue-400 font-semibold">{photoQuality.good}</span> boas</p>
                <p><span className="text-yellow-400 font-semibold">{photoQuality.average}</span> medianas</p>
                <p><span className="text-red-400 font-semibold">{photoQuality.poor}</span> ruins</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Atributos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-green-400 font-semibold">{attrFilled}</span> preenchidos</p>
                <p><span className="text-yellow-400 font-semibold">{attributes.length - attrFilled}</span> pendentes</p>
                {requiredAttrs.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-0.5">
                    {requiredFilled}/{requiredAttrs.length} obrigatórios
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Tags Positivas</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold text-green-400">{positiveTags.length}</span>
                {negativeTags.length > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    {negativeTags.length} problema{negativeTags.length !== 1 ? "s" : ""} detectado{negativeTags.length !== 1 ? "s" : ""}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Repasse Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-green-400">
                  R$ {formatPrice(repasseAmount)}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Comissão {(effectiveCommissionRate * 100).toFixed(1)}%
                  {saleFeeData ? " real" : " est."}
                  {custoFrete > 0 ? " + frete" : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* === FOTO PRINCIPAL EM DESTAQUE + GALERIA === */}
          {pictures.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    Fotos do Anúncio
                    <span className="text-sm font-normal text-muted-foreground">
                      ({pictures.length} foto{pictures.length !== 1 ? "s" : ""})
                    </span>
                  </CardTitle>
                  {hasLowQualityPhotos && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPhotos}
                      disabled={downloadingPhotos}
                    >
                      {downloadingPhotos ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Baixar fotos para otimizar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: 450, minWidth: 88 }}>
                    {pictures.map((pic, idx) => {
                      const quality = classifyPhoto(pic.size as string);
                      const isSelected = idx === galleryIdx;
                      const borderColor = isSelected
                        ? "border-primary"
                        : quality === "excellent" ? "border-green-500"
                        : quality === "good" ? "border-blue-500"
                        : quality === "average" ? "border-yellow-500" : "border-red-500";
                      return (
                        <button
                          key={idx}
                          onClick={() => setGalleryIdx(idx)}
                          className={`flex-shrink-0 rounded-lg overflow-hidden border-2 ${borderColor} hover:opacity-75 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary`}
                          title={`Foto ${idx + 1} — ${(pic.size as string) ?? "tamanho desconhecido"}`}
                        >
                          <img
                            src={getPictureUrl(pic)}
                            alt={`Foto ${idx + 1}`}
                            className="object-cover"
                            style={{ width: 80, height: 80 }}
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>

                  {(() => {
                    const currentPic = pictures[galleryIdx] ?? pictures[0];
                    const mainUrl = getPictureUrl(currentPic);
                    const mainSize = currentPic.size as string | undefined;
                    const mainQuality = classifyPhoto(mainSize);
                    const qualityLabel =
                      mainQuality === "excellent" ? "Excelente" :
                      mainQuality === "good" ? "Boa" :
                      mainQuality === "average" ? "Mediana" : "Ruim";
                    const qualityBorderColor =
                      mainQuality === "excellent" ? "border-green-500/50" :
                      mainQuality === "good" ? "border-blue-500/50" :
                      mainQuality === "average" ? "border-yellow-500/50" : "border-red-500/50";
                    const qualityBadgeClass =
                      mainQuality === "excellent" ? "bg-green-500/90 text-white" :
                      mainQuality === "good" ? "bg-blue-500/90 text-white" :
                      mainQuality === "average" ? "bg-yellow-500/90 text-black" :
                      "bg-red-500/90 text-white";
                    const qualityTextColor =
                      mainQuality === "excellent" ? "text-green-400" :
                      mainQuality === "good" ? "text-blue-400" :
                      mainQuality === "average" ? "text-yellow-400" : "text-red-400";
                    return (
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div
                          className={`relative rounded-xl overflow-hidden border-2 ${qualityBorderColor} shadow-lg bg-gray-900 cursor-pointer`}
                          onClick={() => setSelectedPhoto(galleryIdx)}
                        >
                          <img
                            src={mainUrl}
                            alt={`Foto ${galleryIdx + 1}`}
                            className="object-contain w-full"
                            style={{ height: 450 }}
                            loading="lazy"
                          />
                          {galleryIdx === 0 && (
                            <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-md">
                              Foto Principal
                            </span>
                          )}
                          <span className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-md ${qualityBadgeClass}`}>
                            {qualityLabel}
                          </span>
                        </div>
                        {mainSize && (
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-muted-foreground">
                              Dimensão: <span className="font-semibold text-foreground">{mainSize} px</span>
                            </span>
                            <span className={`text-sm font-semibold ${qualityTextColor}`}>
                              {qualityLabel}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          ✅ Excelente ≥ 1200px | 🟡 Boa ≥ 800px | 🟠 Mediana ≥ 500px | 🔴 Ruim &lt; 500px
                        </p>
                        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                          <p className="text-sm text-foreground">
                            💡 Dimensão ideal para o Mercado Livre: <strong>1200 x 1200 px</strong> (mínimo) ou <strong>2000 x 2000 px</strong> (recomendado). Formato JPG ou PNG. Fundo branco. Produto ocupando 80% da imagem. Redimensione no Canva antes de subir.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* === ANÁLISE DE FOTOS === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise de Fotos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{photoQuality.excellent}</p>
                  <p className="text-xs text-muted-foreground mt-1">Excelentes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">{photoQuality.good}</p>
                  <p className="text-xs text-muted-foreground mt-1">Boas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">{photoQuality.average}</p>
                  <p className="text-xs text-muted-foreground mt-1">Medianas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-400">{photoQuality.poor}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ruins</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground border border-border/50 rounded-lg px-4 py-2.5 bg-muted/20">
                📐 Critério: <strong>Excelente</strong> ≥ 1200px | <strong>Boa</strong> ≥ 800px | <strong>Mediana</strong> ≥ 500px | <strong>Ruim</strong> &lt; 500px
              </p>
            </CardContent>
          </Card>

          {/* === INFORMAÇÕES DO ANÚNCIO === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do Anúncio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Título</span>
                  <span className="font-medium">{(itemData.title as string) ?? "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Código MLB</span>
                  <span className="font-medium font-mono">{(itemData.id as string) ?? "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Tipo de Anúncio</span>
                  <span className="font-medium">
                    {getListingTypeLabel((itemData.listing_type_id as string) ?? "")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Idade do Anúncio</span>
                  <span className="font-medium">
                    {listingAge
                      ? `${listingAge.months} meses (criado em ${listingAge.formatted})`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Status</span>
                  <span
                    className={`font-semibold ${
                      itemStatus === "active"
                        ? "text-green-400"
                        : itemStatus === "paused"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Vendedor</span>
                  <span className="font-medium">
                    {(sellerData?.nickname as string) ??
                      (itemData.seller_id != null ? String(itemData.seller_id) : "-")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Catálogo ML</span>
                  {catalogStatus && (
                    <span className={`font-medium text-sm ${catalogStatus.color}`}>
                      {catalogStatus.label}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Clip / Vídeo</span>
                  {videosData === null ? (
                    <span className="text-muted-foreground text-xs">Verificando...</span>
                  ) : hasVideos ? (
                    <span className="text-green-400 font-medium text-xs">
                      ✅ Possui clip/vídeo ({videosData.length} vídeo{videosData.length !== 1 ? "s" : ""})
                    </span>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-red-400 font-medium text-xs leading-snug block">
                        ❌ Sem clip/vídeo — adicionar clips aumenta o ranking
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateClipPrompt}
                        disabled={clipPromptLoading}
                        className="h-7 text-xs border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
                      >
                        {clipPromptLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                        ) : (
                          <Film className="h-3 w-3 mr-1.5" />
                        )}
                        Gerar Ideia de Clip para IA
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Repasse breakdown */}
              <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2.5">
                <p className="text-sm font-semibold mb-1">Cálculo de Repasse</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço do anúncio</span>
                  <span className="font-medium">R$ {formatPrice(displayPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Comissão ML ({(effectiveCommissionRate * 100).toFixed(1)}%
                    {saleFeeData ? " real" : " est."})
                  </span>
                  <span className="text-red-400">− R$ {formatPrice(effectiveCommissionAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxa fixa</span>
                  <span className={taxaFixa > 0 ? "text-red-400" : "text-muted-foreground"}>
                    {taxaFixa > 0 ? `− R$ ${formatPrice(taxaFixa)}` : "R$ 0,00"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Custo de envio ML
                    {custoFrete > 0 && <span className="text-xs ml-1 opacity-70">(est.)</span>}
                  </span>
                  <span className={custoFrete > 0 ? "text-red-400" : "text-muted-foreground"}>
                    {custoFrete > 0 ? `− R$ ${formatPrice(custoFrete)}` : "R$ 0,00"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-border/50 pt-2.5 mt-1">
                  <span className="font-semibold">Valor de repasse</span>
                  <span className="font-bold text-green-400 text-lg">
                    R$ {formatPrice(repasseAmount)}
                  </span>
                </div>
                <p className="text-xs text-yellow-500/80 pt-1">
                  ⚠️ Valor estimado. O repasse real pode variar conforme peso, dimensões e região de entrega.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* === CLIP PROMPT RESULT === */}
          {showClipResult && (
            <Card className="border-purple-500/30 bg-purple-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Film className="h-4 w-4 text-purple-400" />
                    Ideia de Clip Gerada por IA
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowClipResult(false); setClipPromptResult(null); }}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {clipPromptLoading && (
                  <div className="flex items-center gap-3 py-6 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                    <span className="text-sm text-muted-foreground">Gerando ideia de clip...</span>
                  </div>
                )}

                {clipPromptResult && !clipPromptLoading && (
                  <>
                    {/* Sora Prompt */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase font-semibold text-purple-400">
                          Prompt para o Kling AI
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyText(clipPromptResult.soraPrompt)}
                            className="h-7 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                          <a
                            href="https://klingai.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline"
                          >
                            Abrir Kling AI
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4 text-sm font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                        {clipPromptResult.soraPrompt}
                      </div>
                    </div>

                    {/* Dicas celular */}
                    {clipPromptResult.dicasGravacao && (
                      <div>
                        <p className="text-xs uppercase font-semibold text-blue-400 mb-2">
                          📱 Dicas para gravar com celular
                        </p>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {clipPromptResult.dicasGravacao}
                        </div>
                      </div>
                    )}

                    {/* Roteiro */}
                    {clipPromptResult.roteiro && (
                      <div>
                        <p className="text-xs uppercase font-semibold text-green-400 mb-2">
                          🎬 Roteiro sugerido
                        </p>
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {clipPromptResult.roteiro}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* === SHIPPING === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações de Envio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Localização do Estoque</span>
                  <span className="font-medium">{locationStr}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Frete Grátis</span>
                  <span className="font-medium">
                    {freeShipping === true ? "Sim ✅" : freeShipping === false ? "Não ❌" : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Fulfillment (Full)</span>
                  <span className="font-medium">{isFulfillment ? "Sim ✅" : "Não ❌"}</span>
                </div>
                {shippingCost != null && (
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Custo de Envio</span>
                    <span className="font-medium">
                      {(shippingCost as number) === 0
                        ? "Grátis"
                        : `R$ ${formatPrice(shippingCost as number)}`}
                    </span>
                  </div>
                )}
                {logisticType && (
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Modalidade de Envio</span>
                    <span className="font-medium capitalize">{logisticType.replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>

              {/* Real shipping options from depot */}
              <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-semibold">Opções de Envio Reais</p>
                  <span className="text-xs text-muted-foreground">Origem: Extrema, MG (CEP 37644-020)</span>
                </div>
                {freeShipping === true && (
                  <p className="text-sm text-green-400 font-medium">✅ Frete Grátis para o comprador</p>
                )}
                {shippingOptions === null && (
                  <p className="text-xs text-muted-foreground">Buscando opções de envio...</p>
                )}
                {shippingOptions !== null && shippingOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Opções de envio não disponíveis via API (possível restrição de CORS ou anúncio sem frete calculado).
                  </p>
                )}
                {shippingOptions !== null && shippingOptions.length > 0 && (
                  <div className="space-y-2">
                    {shippingOptions.map((opt, i) => {
                      const optName = (opt.name as string) ?? `Opção ${i + 1}`;
                      const cost = (opt.cost as number) ?? (opt.list_cost as number) ?? null;
                      const estDate =
                        ((opt.estimated_delivery_limit as Record<string, unknown>)?.date as string) ??
                        ((opt.estimated_schedule as Record<string, unknown>)?.date as string) ??
                        null;
                      const isFree = cost === 0 || (freeShipping === true && cost != null);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                        >
                          <span className="font-medium">{optName}</span>
                          <div className="flex items-center gap-4">
                            {estDate && (
                              <span className="text-xs text-muted-foreground">
                                até {new Date(estDate).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            <span className={isFree ? "text-green-400 font-semibold" : "font-semibold"}>
                              {isFree ? "Grátis" : cost != null ? `R$ ${formatPrice(cost)}` : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* === ANÁLISE DE TAGS (3 grupos) === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise de Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grupo 1: Requer Atenção */}
              <div>
                <p className="text-sm font-semibold text-red-400 mb-3">🚨 Requer Atenção</p>
                {negativeTags.length === 0 ? (
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
                    ✅ Nenhum problema identificado nas tags do anúncio!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {negativeTags.map((tag) => {
                      const info = getTagInfo(tag);
                      return (
                        <div
                          key={tag}
                          className="rounded-lg border border-red-500/30 bg-red-500/5 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl leading-none mt-0.5 shrink-0">⚠️</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground">{info.nome}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{info.descricao}</p>
                              {info.acao && (
                                <div className="mt-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
                                  <p className="text-xs font-semibold text-red-300 mb-0.5">O que fazer:</p>
                                  <p className="text-xs text-foreground">{info.acao}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grupo 2: Pontos Positivos */}
              <div>
                <p className="text-sm font-semibold text-green-400 mb-3">✅ Pontos Positivos</p>
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">ℹ️ Tags não disponíveis para este anúncio.</p>
                ) : positiveTags.length === 0 ? (
                  <div className="rounded-lg border border-border/40 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                    Nenhuma tag positiva encontrada.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {positiveTags.map((tag) => {
                      const info = getTagInfo(tag);
                      return (
                        <div
                          key={tag}
                          className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 flex items-start gap-3"
                        >
                          <span className="text-lg leading-none mt-0.5 shrink-0">✅</span>
                          <div>
                            <p className="font-medium text-sm text-foreground">{info.nome}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{info.descricao}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grupo 3: Status Interno */}
              {neutralTags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3">ℹ️ Status Interno</p>
                  <div className="space-y-1.5">
                    {neutralTags.map((tag) => {
                      const info = getTagInfo(tag);
                      return (
                        <div
                          key={tag}
                          className="rounded-lg border border-border/40 bg-muted/20 p-3 flex items-start gap-3"
                        >
                          <span className="text-base leading-none mt-0.5 shrink-0 text-muted-foreground">ℹ️</span>
                          <div>
                            <p className="font-medium text-sm text-foreground">{info.nome}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{info.descricao}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags do Vendedor */}
              {sellerTags.length > 0 && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                    Tags do Vendedor
                  </p>
                  <div className="space-y-1">
                    {sellerTags.map((tag) => {
                      const friendlyName = SELLER_TAG_FRIENDLY[tag] ?? tag;
                      return (
                        <div
                          key={tag}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                        >
                          <span className="text-sm text-foreground">{friendlyName}</span>
                          <span className="text-xs font-mono text-muted-foreground">{tag}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* === ATRIBUTOS DETALHADOS === */}
          {attributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ficha Técnica — Características</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Card resumo */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <p className="text-sm font-semibold leading-relaxed">
                    Ficha Técnica:{" "}
                    <span className="text-green-400">{requiredFilled} obrigatórios ✅</span>
                    {" | "}
                    <span className="text-yellow-400">{importantFilled} importantes ✅</span>
                    {" | "}
                    <span className="text-gray-400">{secondaryFilled} secundários ✅</span>
                    {" | "}
                    <span className="text-red-400">{totalPending} pendentes ⚠️</span>
                  </p>
                </div>

                {/* Grupo A: Obrigatórios */}
                {requiredAttrs.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-400 mb-2">
                      Obrigatórios — {requiredFilled} de {requiredAttrs.length} preenchidos
                    </p>
                    <div className="space-y-1.5">
                      {requiredAttrs.map(attr => (
                        <div
                          key={attr.id as string}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            attr.value_name != null
                              ? "border-green-500/30 bg-green-500/5"
                              : "border-red-500/30 bg-red-500/5"
                          }`}
                        >
                          <span className="font-medium">{attr.name as string}</span>
                          {attr.value_name != null ? (
                            <span className="text-green-400 text-xs font-semibold">{attr.value_name as string}</span>
                          ) : (
                            <span className="text-red-400 text-xs font-semibold">Não preenchido ⚠️</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grupo B: Principais */}
                {importantAttrs.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-yellow-400 mb-2">
                      Principais — {importantFilled} de {importantAttrs.length} preenchidos
                    </p>
                    <div className="space-y-1.5">
                      {importantAttrs.map(attr => (
                        <div
                          key={attr.id as string}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            attr.value_name != null
                              ? "border-green-500/30 bg-green-500/5"
                              : "border-yellow-500/30 bg-yellow-500/5"
                          }`}
                        >
                          <span className="font-medium">{attr.name as string}</span>
                          {attr.value_name != null ? (
                            <span className="text-green-400 text-xs font-semibold">{attr.value_name as string}</span>
                          ) : (
                            <span className="text-yellow-400 text-xs font-semibold">Não preenchido ⚠️</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grupo C: Secundários (collapsível) */}
                {secondaryAttrsAll.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowSecondaryAttrs(v => !v)}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2 hover:text-foreground transition-colors"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${showSecondaryAttrs ? "rotate-180" : ""}`}
                      />
                      Secundários ({secondaryAttrsAll.length}) — {secondaryFilled} preenchidos
                    </button>
                    {showSecondaryAttrs && (
                      <div className="space-y-1.5">
                        {secondaryAttrsAll.map(attr => (
                          <div
                            key={attr.id as string}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                              attr.value_name != null
                                ? "border-green-500/20 bg-green-500/5"
                                : "border-border/40 bg-muted/10"
                            }`}
                          >
                            <span className="font-medium text-muted-foreground">{attr.name as string}</span>
                            {attr.value_name != null ? (
                              <span className="text-green-400 text-xs font-semibold">{attr.value_name as string}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">Não preenchido</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* === INFORMAÇÕES REGULATÓRIAS === */}
          {attributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações Regulatórias</CardTitle>
              </CardHeader>
              <CardContent>
                {regulatoryAttrs.length > 0 ? (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
                    <p className="text-sm font-semibold text-green-400">✅ Informação regulatória presente</p>
                    <div className="space-y-2">
                      {regulatoryAttrs.map(attr => (
                        <div
                          key={attr.id as string}
                          className="flex items-center justify-between text-sm rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2"
                        >
                          <span className="font-medium">{attr.name as string}</span>
                          <span className={attr.value_name != null ? "text-green-400 text-xs font-semibold" : "text-yellow-400 text-xs font-semibold"}>
                            {attr.value_name != null ? (attr.value_name as string) : "Não preenchido ⚠️"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
                    <p className="text-sm font-semibold text-yellow-400">⚠️ Nenhuma informação regulatória identificada</p>
                    <p className="text-sm text-muted-foreground">
                      Verifique se seu produto necessita de certificação INMETRO, ANATEL ou ANVISA.
                      Produtos sem certificação obrigatória podem ser removidos pelo ML.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* === ANÁLISE DO TÍTULO === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise do Título</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg px-4 py-3">
                <p className="text-sm font-medium leading-relaxed">{title}</p>
                <p className="text-xs text-muted-foreground mt-2">{titleLen} caracteres</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm">
                  {titleLen >= 60 && titleLen <= 80 ? (
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                  )}
                  <span>
                    Comprimento ideal (60–80 chars) — atual:{" "}
                    <span className="font-semibold">{titleLen}</span> chars
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  {hasMeasures ? (
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                  )}
                  <span>Contém medidas / dimensões</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  {brandName ? (
                    titleHasBrand ? (
                      <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                    )
                  ) : (
                    <Info className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                  <span>
                    {brandName
                      ? `Contém marca do produto (${brandName})`
                      : "Marca não identificada nos atributos"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* === EXPERIÊNCIA DE COMPRA === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Experiência de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Score com barra */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Score de Experiência de Compra</span>
                  <span
                    className={`font-bold text-lg ${
                      experienceScore > 7
                        ? "text-green-400"
                        : experienceScore >= 5
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {experienceScore}/{experienceTotal}
                  </span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      experienceScore > 7
                        ? "bg-green-500"
                        : experienceScore >= 5
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.round((experienceScore / experienceTotal) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Grupos de checks */}
              {(["Entrega", "Anúncio", "Vendedor"] as const).map(group => (
                <div key={group}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{group}</p>
                  <div className="space-y-1.5">
                    {experienceChecks
                      .filter(c => c.group === group)
                      .map((check, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm">
                          {check.ok ? (
                            <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-red-400 shrink-0" />
                          )}
                          <span className={check.ok ? "text-foreground" : "text-muted-foreground"}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* === DESCRIÇÃO + IA === */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base">Descrição e Análise com IA</CardTitle>
                {!import.meta.env.VITE_ANTHROPIC_API_KEY ? (
                  <span className="text-xs text-yellow-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Configure VITE_ANTHROPIC_API_KEY no .env para usar análise com IA
                  </span>
                ) : (
                  <Button onClick={handleImproveDescription} disabled={aiLoading} size="sm">
                    {aiLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Melhorar Descrição com IA
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid gap-4 ${aiDescription ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase text-muted-foreground font-semibold">
                      Descrição Atual
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {description.length} chars · {descWords} palavras
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap min-h-32 leading-relaxed">
                    {description || (
                      <span className="text-muted-foreground italic">Sem descrição cadastrada.</span>
                    )}
                  </div>
                </div>

                {aiDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase text-muted-foreground font-semibold">
                        Descrição Melhorada (IA)
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {aiDescription.length} chars · {aiDescWords} palavras
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyText(aiDescription)}
                          className="h-7 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar Descrição
                        </Button>
                      </div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap min-h-32 leading-relaxed">
                      {aiDescription}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>
                        Tamanho:{" "}
                        <span className={aiDescription.length > description.length ? "text-green-400 font-semibold" : ""}>
                          {aiDescription.length > description.length ? "+" : ""}
                          {aiDescription.length - description.length} chars
                        </span>
                      </span>
                      <span>
                        Palavras:{" "}
                        <span className={aiDescWords > descWords ? "text-green-400 font-semibold" : ""}>
                          {aiDescWords > descWords ? "+" : ""}
                          {aiDescWords - descWords} palavras
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto !== null && pictures.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-5 w-5" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto((prev) =>
                prev !== null ? (prev > 0 ? prev - 1 : pictures.length - 1) : 0
              );
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={getPictureUrl(pictures[selectedPhoto])}
              alt={`Foto ${selectedPhoto + 1}`}
              className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {(pictures[selectedPhoto].size as string | undefined) && (
              <p className="text-white/70 text-xs">
                {pictures[selectedPhoto].size as string}px
              </p>
            )}
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto((prev) =>
                prev !== null ? (prev < pictures.length - 1 ? prev + 1 : 0) : 0
              );
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-1.5 rounded-full">
            {selectedPhoto + 1} / {pictures.length}
          </div>
        </div>
      )}
    </div>
  );
}
