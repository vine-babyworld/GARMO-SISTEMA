import { useEffect, useMemo, useState } from "react";
import {
  RotateCcw,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  PackageSearch,
  Filter,
  X,
  ClipboardList,
  UserCheck,
  ShieldAlert,
  CalendarIcon,
  Pencil,
  Save,
  Check,
  ChevronsUpDown,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import {
  addDevolucao,
  deleteDevolucao,
  getDevolucoes,
  updateDevolucao,
} from "@/lib/devolucoesFirestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type DevolucaoStatus =
  | "Aguardando retorno"
  | "Recebido no depósito"
  | "Em conferência"
  | "Aprovado para estoque"
  | "Com avaria"
  | "Descartado"
  | "Finalizado";

type DestinoFinal =
  | ""
  | "Retornar ao estoque"
  | "Reembalar"
  | "Assistência"
  | "Descartar"
  | "Devolver ao fornecedor"
  | "Em análise";

type EmpresaResponsavel = "" | "BABY WORLD" | "MP BABY";

type DevolucaoItem = {
  id: string;
  sku: string;
  produtoNome: string;
  empresa: EmpresaResponsavel;
  marketplace: string;
  data: string;
  pedido: string;
  motivo: string;
  valor: number;
  observacoes: string;
  confirmada: boolean;
  status: DevolucaoStatus;

  responsavelRecebimento: string;
  dataRecebimento: string;

  responsavelConferencia: string;
  dataConferencia: string;

  destinoFinal: DestinoFinal;
  motivoDestino: string;

  avariaConfirmada: boolean;
  retornouAoEstoque: boolean;
};

type FormState = {
  sku: string;
  produtoNome: string;
  empresa: EmpresaResponsavel;
  marketplace: string;
  data: string;
  pedido: string;
  motivo: string;
  valor: string;
  observacoes: string;
  confirmada: boolean;
  status: DevolucaoStatus;

  responsavelRecebimento: string;
  dataRecebimento: string;

  responsavelConferencia: string;
  dataConferencia: string;

  destinoFinal: DestinoFinal;
  motivoDestino: string;

  avariaConfirmada: boolean;
  retornouAoEstoque: boolean;
};

type ProductOption = {
  sku: string;
  name: string;
};

const statusOptions: DevolucaoStatus[] = [
  "Aguardando retorno",
  "Recebido no depósito",
  "Em conferência",
  "Aprovado para estoque",
  "Com avaria",
  "Descartado",
  "Finalizado",
];

const destinoOptions: DestinoFinal[] = [
  "",
  "Retornar ao estoque",
  "Reembalar",
  "Assistência",
  "Descartar",
  "Devolver ao fornecedor",
  "Em análise",
];

const marketplaceOptions = [
  "Mercado Livre",
  "Shopee",
  "Amazon",
  "Site",
  "Via Varejo",
  "Shein",
  "TikTok Shop",
  "Loja física",
];

const empresaOptions: EmpresaResponsavel[] = ["", "BABY WORLD", "MP BABY"];

const statColorMap = {
  primary: "text-primary glow-orange border-primary/20",
  accent: "text-accent glow-blue border-accent/20",
  warning: "text-warning glow-yellow border-warning/20",
  success: "text-success border-success/20",
};

const statIconBgMap = {
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  warning: "bg-warning/10",
  success: "bg-success/10",
};

const statIconColorMap = {
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-warning",
  success: "text-success",
};

const fieldClass =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary";

function emptyForm(): FormState {
  return {
    sku: "",
    produtoNome: "",
    empresa: "",
    marketplace: "",
    data: "",
    pedido: "",
    motivo: "",
    valor: "",
    observacoes: "",
    confirmada: false,
    status: "Aguardando retorno",

    responsavelRecebimento: "",
    dataRecebimento: "",

    responsavelConferencia: "",
    dataConferencia: "",

    destinoFinal: "",
    motivoDestino: "",

    avariaConfirmada: false,
    retornouAoEstoque: false,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function parseDateString(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toDateString(date?: Date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Devolucoes() {
  const { products } = useProducts();

  const [selectedItem, setSelectedItem] = useState<DevolucaoItem | null>(null);
  const [editingItem, setEditingItem] = useState<DevolucaoItem | null>(null);
  const [editForm, setEditForm] = useState<FormState | null>(null);

  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [devolucoes, setDevolucoes] = useState<DevolucaoItem[]>([]);

  const [filters, setFilters] = useState({
    busca: "",
    empresa: "",
    marketplace: "",
    status: "",
    dataInicio: "",
    dataFim: "",
  });

  const [form, setForm] = useState<FormState>(emptyForm());

  async function loadDevolucoes() {
    try {
      setLoading(true);
      const result = await getDevolucoes();
      setDevolucoes(result as DevolucaoItem[]);
    } catch (error) {
      console.error("Erro ao carregar devoluções:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevolucoes();
  }, []);

  useEffect(() => {
    if (!form.sku.trim()) {
      setForm((prev) => ({ ...prev, produtoNome: "" }));
      return;
    }

    const product = products.find(
      (p) =>
        String(p.sku).trim().toLowerCase() === form.sku.trim().toLowerCase()
    );

    setForm((prev) => ({
      ...prev,
      produtoNome: product?.name ?? "",
    }));
  }, [form.sku, products]);

  useEffect(() => {
    if (!editForm) return;

    if (!editForm.sku.trim()) {
      setEditForm((prev) => (prev ? { ...prev, produtoNome: "" } : prev));
      return;
    }

    const product = products.find(
      (p) =>
        String(p.sku).trim().toLowerCase() ===
        editForm.sku.trim().toLowerCase()
    );

    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            produtoNome: product?.name ?? "",
          }
        : prev
    );
  }, [editForm?.sku, products]);

  const filteredData = useMemo(() => {
    return devolucoes.filter((item) => {
      const busca = filters.busca.trim().toLowerCase();

      const matchesBusca =
        !busca ||
        item.sku?.toLowerCase().includes(busca) ||
        item.produtoNome?.toLowerCase().includes(busca) ||
        item.pedido?.toLowerCase().includes(busca) ||
        item.motivo?.toLowerCase().includes(busca);

      const matchesEmpresa =
        !filters.empresa || item.empresa === filters.empresa;

      const matchesMarketplace =
        !filters.marketplace || item.marketplace === filters.marketplace;

      const matchesStatus = !filters.status || item.status === filters.status;

      const matchesDataInicio = !filters.dataInicio || item.data >= filters.dataInicio;
      const matchesDataFim = !filters.dataFim || item.data <= filters.dataFim;

      return (
        matchesBusca &&
        matchesEmpresa &&
        matchesMarketplace &&
        matchesStatus &&
        matchesDataInicio &&
        matchesDataFim
      );
    });
  }, [devolucoes, filters]);

  const stats = useMemo(() => {
    const totalValor = filteredData.reduce(
      (acc, item) => acc + (Number(item.valor) || 0),
      0
    );

    const totalQtd = filteredData.length;
    const totalConfirmadas = filteredData.filter((item) => item.confirmada).length;

    const motivosCount = filteredData.reduce<Record<string, number>>(
      (acc, item) => {
        const motivo = item.motivo?.trim() || "Não informado";
        acc[motivo] = (acc[motivo] || 0) + 1;
        return acc;
      },
      {}
    );

    const topMotivo =
      Object.entries(motivosCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      totalValor,
      totalQtd,
      totalConfirmadas,
      topMotivo,
    };
  }, [filteredData]);

  const productOptions = useMemo<ProductOption[]>(() => {
    return [...products]
      .filter((p) => p?.sku && p?.name)
      .map((p) => ({
        sku: String(p.sku),
        name: String(p.name),
      }))
      .sort((a, b) => a.sku.localeCompare(b.sku, "pt-BR"));
  }, [products]);

  function validateSku(sku: string) {
    return products.some(
      (p) => String(p.sku).trim().toLowerCase() === sku.trim().toLowerCase()
    );
  }

  async function handleSave() {
    if (!form.sku.trim()) {
      alert("Informe o SKU.");
      return;
    }

    if (!validateSku(form.sku)) {
      alert("Selecione um SKU válido cadastrado no sistema.");
      return;
    }

    if (!form.empresa.trim()) {
      alert("Informe a empresa responsável.");
      return;
    }

    if (!form.marketplace.trim()) {
      alert("Informe o marketplace.");
      return;
    }

    if (!form.data) {
      alert("Informe a data da devolução.");
      return;
    }

    if (!form.pedido.trim()) {
      alert("Informe o pedido.");
      return;
    }

    if (!form.motivo.trim()) {
      alert("Informe o motivo da devolução.");
      return;
    }

    try {
      await addDevolucao({
        sku: form.sku.trim(),
        produtoNome: form.produtoNome.trim(),
        empresa: form.empresa,
        marketplace: form.marketplace.trim(),
        data: form.data,
        pedido: form.pedido.trim(),
        motivo: form.motivo.trim(),
        valor: Number(form.valor || 0),
        observacoes: form.observacoes.trim(),
        confirmada: form.confirmada,
        status: form.status,

        responsavelRecebimento: form.responsavelRecebimento.trim(),
        dataRecebimento: form.dataRecebimento,

        responsavelConferencia: form.responsavelConferencia.trim(),
        dataConferencia: form.dataConferencia,

        destinoFinal: form.destinoFinal,
        motivoDestino: form.motivoDestino.trim(),

        avariaConfirmada: form.avariaConfirmada,
        retornouAoEstoque: form.retornouAoEstoque,
      });

      setForm(emptyForm());
      await loadDevolucoes();
    } catch (error) {
      console.error("Erro ao salvar devolução:", error);
      alert("Não foi possível salvar a devolução.");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Deseja realmente excluir esta devolução?");
    if (!confirmed) return;

    try {
      await deleteDevolucao(id);
      await loadDevolucoes();
    } catch (error) {
      console.error("Erro ao excluir devolução:", error);
      alert("Não foi possível excluir a devolução.");
    }
  }

  async function handleToggleConfirm(item: DevolucaoItem) {
    try {
      await updateDevolucao(item.id, {
        confirmada: !item.confirmada,
      });
      await loadDevolucoes();
    } catch (error) {
      console.error("Erro ao atualizar confirmação:", error);
      alert("Não foi possível atualizar a confirmação.");
    }
  }

  async function handleStatusChange(item: DevolucaoItem, status: DevolucaoStatus) {
    try {
      await updateDevolucao(item.id, { status });
      await loadDevolucoes();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Não foi possível atualizar o status.");
    }
  }

  function openEditModal(item: DevolucaoItem) {
    setEditingItem(item);
    setEditForm({
      sku: item.sku ?? "",
      produtoNome: item.produtoNome ?? "",
      empresa: item.empresa ?? "",
      marketplace: item.marketplace ?? "",
      data: item.data ?? "",
      pedido: item.pedido ?? "",
      motivo: item.motivo ?? "",
      valor: String(item.valor ?? ""),
      observacoes: item.observacoes ?? "",
      confirmada: Boolean(item.confirmada),
      status: item.status ?? "Aguardando retorno",

      responsavelRecebimento: item.responsavelRecebimento ?? "",
      dataRecebimento: item.dataRecebimento ?? "",

      responsavelConferencia: item.responsavelConferencia ?? "",
      dataConferencia: item.dataConferencia ?? "",

      destinoFinal: item.destinoFinal ?? "",
      motivoDestino: item.motivoDestino ?? "",

      avariaConfirmada: Boolean(item.avariaConfirmada),
      retornouAoEstoque: Boolean(item.retornouAoEstoque),
    });
  }

  async function handleSaveEdit() {
    if (!editingItem || !editForm) return;

    if (!editForm.sku.trim()) {
      alert("Informe o SKU.");
      return;
    }

    if (!validateSku(editForm.sku)) {
      alert("Selecione um SKU válido cadastrado no sistema.");
      return;
    }

    if (!editForm.empresa.trim()) {
      alert("Informe a empresa responsável.");
      return;
    }

    if (!editForm.marketplace.trim()) {
      alert("Informe o marketplace.");
      return;
    }

    if (!editForm.data) {
      alert("Informe a data da devolução.");
      return;
    }

    if (!editForm.pedido.trim()) {
      alert("Informe o pedido.");
      return;
    }

    if (!editForm.motivo.trim()) {
      alert("Informe o motivo da devolução.");
      return;
    }

    try {
      setSavingEdit(true);

      await updateDevolucao(editingItem.id, {
        sku: editForm.sku.trim(),
        produtoNome: editForm.produtoNome.trim(),
        empresa: editForm.empresa,
        marketplace: editForm.marketplace.trim(),
        data: editForm.data,
        pedido: editForm.pedido.trim(),
        motivo: editForm.motivo.trim(),
        valor: Number(editForm.valor || 0),
        observacoes: editForm.observacoes.trim(),
        confirmada: editForm.confirmada,
        status: editForm.status,

        responsavelRecebimento: editForm.responsavelRecebimento.trim(),
        dataRecebimento: editForm.dataRecebimento,

        responsavelConferencia: editForm.responsavelConferencia.trim(),
        dataConferencia: editForm.dataConferencia,

        destinoFinal: editForm.destinoFinal,
        motivoDestino: editForm.motivoDestino.trim(),

        avariaConfirmada: editForm.avariaConfirmada,
        retornouAoEstoque: editForm.retornouAoEstoque,
      });

      await loadDevolucoes();

      const updatedItem: DevolucaoItem = {
        ...editingItem,
        ...editForm,
        valor: Number(editForm.valor || 0),
      };

      setSelectedItem(updatedItem);
      setEditingItem(null);
      setEditForm(null);
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      alert("Não foi possível salvar as alterações.");
    } finally {
      setSavingEdit(false);
    }
  }

  function exportToExcel() {
    const rows = filteredData.map((item) => ({
      SKU: item.sku || "",
      Produto: item.produtoNome || "",
      Empresa: item.empresa || "",
      Marketplace: item.marketplace || "",
      Pedido: item.pedido || "",
      Data: item.data || "",
      Motivo: item.motivo || "",
      Valor: Number((item.valor || 0).toFixed(2)),
      Status: item.status || "",
      Confirmada: item.confirmada ? "Sim" : "Não",
      "Responsável Recebimento": item.responsavelRecebimento || "",
      "Data Recebimento": item.dataRecebimento || "",
      "Responsável Conferência": item.responsavelConferencia || "",
      "Data Conferência": item.dataConferencia || "",
      "Destino Final": item.destinoFinal || "",
      "Motivo Destino": item.motivoDestino || "",
      "Avaria Confirmada": item.avariaConfirmada ? "Sim" : "Não",
      "Retornou ao Estoque": item.retornouAoEstoque ? "Sim" : "Não",
      Observações: item.observacoes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Devoluções");

    let filename = "devolucoes_completo.xlsx";
    if (filters.dataInicio || filters.dataFim) {
      const toDisplay = (d: string) => d.split("-").reverse().join("-");
      const inicio = filters.dataInicio ? toDisplay(filters.dataInicio) : "inicio";
      const fim = filters.dataFim ? toDisplay(filters.dataFim) : "fim";
      filename = `devolucoes_${inicio}_ate_${fim}.xlsx`;
    }

    XLSX.writeFile(wb, filename);
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Devoluções
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle de mercadorias devolvidas e acompanhamento operacional
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total devolvido"
          value={formatCurrency(stats.totalValor)}
          icon={RotateCcw}
          tone="primary"
        />
        <StatCard
          label="Quantidade"
          value={String(stats.totalQtd)}
          icon={PackageSearch}
          tone="accent"
        />
        <StatCard
          label="Confirmadas"
          value={String(stats.totalConfirmadas)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Motivo mais comum"
          value={stats.topMotivo}
          icon={Filter}
          tone="warning"
          compact
        />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <Input
            value={filters.busca}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, busca: e.target.value }))
            }
            placeholder="Buscar por SKU, produto, pedido ou motivo"
          />

          <select
            value={filters.empresa}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, empresa: e.target.value }))
            }
            className={fieldClass}
          >
            <option value="">Todas as empresas</option>
            {empresaOptions
              .filter(Boolean)
              .map((empresa) => (
                <option key={empresa} value={empresa}>
                  {empresa}
                </option>
              ))}
          </select>

          <select
            value={filters.marketplace}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, marketplace: e.target.value }))
            }
            className={fieldClass}
          >
            <option value="">Todos os marketplaces</option>
            {marketplaceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className={fieldClass}
          >
            <option value="">Todos os status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <DatePickerField
            value={filters.dataInicio}
            onChange={(value) => setFilters((prev) => ({ ...prev, dataInicio: value }))}
            placeholder="Data início"
          />

          <DatePickerField
            value={filters.dataFim}
            onChange={(value) => setFilters((prev) => ({ ...prev, dataFim: value }))}
            placeholder="Data fim"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-5 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Nova devolução
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dados principais
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <ProductCombobox
                products={productOptions}
                value={form.sku}
                onChange={(sku) =>
                  setForm((prev) => ({
                    ...prev,
                    sku,
                  }))
                }
                placeholder="Selecionar SKU do produto"
              />

              <Input value={form.produtoNome} placeholder="Produto" disabled />

              <select
                value={form.empresa}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, empresa: e.target.value as EmpresaResponsavel }))
                }
                className={fieldClass}
              >
                <option value="">Empresa responsável</option>
                {empresaOptions
                  .filter(Boolean)
                  .map((empresa) => (
                    <option key={empresa} value={empresa}>
                      {empresa}
                    </option>
                  ))}
              </select>

              <select
                value={form.marketplace}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, marketplace: e.target.value }))
                }
                className={fieldClass}
              >
                <option value="">Marketplace</option>
                {marketplaceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <DatePickerField
                value={form.data}
                onChange={(value) => setForm((prev) => ({ ...prev, data: value }))}
                placeholder="Data da devolução"
              />

              <Input
                value={form.pedido}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, pedido: e.target.value }))
                }
                placeholder="Pedido"
              />

              <Input
                value={form.motivo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, motivo: e.target.value }))
                }
                placeholder="Motivo da devolução"
              />

              <Input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, valor: e.target.value }))
                }
                placeholder="Valor da devolução"
              />

              <div className="md:col-span-2">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as DevolucaoStatus,
                    }))
                  }
                  className={fieldClass}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recebimento e conferência
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                value={form.responsavelRecebimento}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    responsavelRecebimento: e.target.value,
                  }))
                }
                placeholder="Responsável pelo recebimento"
              />

              <DatePickerField
                value={form.dataRecebimento}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, dataRecebimento: value }))
                }
                placeholder="Data de recebimento"
              />

              <Input
                value={form.responsavelConferencia}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    responsavelConferencia: e.target.value,
                  }))
                }
                placeholder="Responsável pela conferência"
              />

              <DatePickerField
                value={form.dataConferencia}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, dataConferencia: value }))
                }
                placeholder="Data de conferência"
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Destino do produto
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                value={form.destinoFinal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    destinoFinal: e.target.value as DestinoFinal,
                  }))
                }
                className={fieldClass}
              >
                <option value="">Destino final</option>
                {destinoOptions.filter(Boolean).map((destino) => (
                  <option key={destino} value={destino}>
                    {destino}
                  </option>
                ))}
              </select>

              <div className="md:col-span-2 xl:col-span-3">
                <Input
                  value={form.motivoDestino}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      motivoDestino: e.target.value,
                    }))
                  }
                  placeholder="Motivo do destino"
                />
              </div>

              <CheckField
                checked={form.avariaConfirmada}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    avariaConfirmada: checked,
                  }))
                }
                label="Avaria confirmada"
              />

              <CheckField
                checked={form.retornouAoEstoque}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    retornouAoEstoque: checked,
                  }))
                }
                label="Retornou ao estoque"
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </p>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_280px]">
              <Textarea
                value={form.observacoes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    observacoes: e.target.value,
                  }))
                }
                placeholder="Observações sobre a devolução, análise do item, condição da embalagem, detalhes internos..."
                className="min-h-[96px]"
              />

              <Button
                onClick={handleSave}
                className="inline-flex h-11 items-center justify-center gap-2 self-end"
              >
                <Plus className="h-4 w-4" />
                Salvar devolução
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Lista de devoluções
          </h2>
          {filteredData.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Marketplace</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Pedido</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Motivo</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Confirmada</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando devoluções...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhuma devolução encontrada.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-border transition hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-foreground">{item.sku}</td>
                    <td className="px-4 py-3 text-foreground">{item.produtoNome || "-"}</td>
                    <td className="px-4 py-3 text-foreground">{item.empresa || "-"}</td>
                    <td className="px-4 py-3 text-foreground">{item.marketplace}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="text-left font-medium text-primary transition hover:opacity-80 hover:underline"
                      >
                        {item.pedido}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-foreground">{item.data}</td>
                    <td className="px-4 py-3 text-foreground">{item.motivo}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(item.valor)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item, e.target.value as DevolucaoStatus)
                        }
                        className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none transition focus:border-primary"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleConfirm(item)}
                        className={cn(
                          "inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition",
                          item.confirmada
                            ? "border border-success/30 bg-success/15 text-success"
                            : "border border-border bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {item.confirmada ? "Confirmada" : "Pendente"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted"
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Editar
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/20"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Detalhes da devolução
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pedido {selectedItem.pedido || "-"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => openEditModal(selectedItem)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="space-y-4 xl:col-span-7">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DetailCard label="Pedido" value={selectedItem.pedido || "-"} />
                    <DetailCard label="Data" value={selectedItem.data || "-"} />
                    <DetailCard label="SKU" value={selectedItem.sku || "-"} />
                    <DetailCard label="Produto" value={selectedItem.produtoNome || "-"} />
                    <DetailCard label="Empresa" value={selectedItem.empresa || "-"} />
                    <DetailCard label="Marketplace" value={selectedItem.marketplace || "-"} />
                    <DetailCard
                      label="Valor da devolução"
                      value={formatCurrency(selectedItem.valor)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <DetailCard label="Motivo" value={selectedItem.motivo || "-"} />
                    <DetailCard
                      label="Observações"
                      value={
                        selectedItem.observacoes?.trim()
                          ? selectedItem.observacoes
                          : "Nenhuma observação registrada."
                      }
                      multiline
                    />
                  </div>
                </div>

                <div className="space-y-4 xl:col-span-5">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Fluxo operacional
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <MiniDetail label="Status" value={selectedItem.status || "-"} />
                      <MiniDetail
                        label="Responsável pelo recebimento"
                        value={selectedItem.responsavelRecebimento || "-"}
                      />
                      <MiniDetail
                        label="Data de recebimento"
                        value={selectedItem.dataRecebimento || "-"}
                      />
                      <MiniDetail
                        label="Responsável pela conferência"
                        value={selectedItem.responsavelConferencia || "-"}
                      />
                      <MiniDetail
                        label="Data de conferência"
                        value={selectedItem.dataConferencia || "-"}
                      />
                      <MiniDetail
                        label="Destino final"
                        value={selectedItem.destinoFinal || "-"}
                      />
                      <MiniDetail
                        label="Motivo do destino"
                        value={selectedItem.motivoDestino || "-"}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Resultado da análise
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <MiniDetail
                        label="Confirmação"
                        value={selectedItem.confirmada ? "Confirmada" : "Pendente"}
                      />
                      <MiniDetail
                        label="Avaria confirmada"
                        value={selectedItem.avariaConfirmada ? "Sim" : "Não"}
                      />
                      <MiniDetail
                        label="Retornou ao estoque"
                        value={selectedItem.retornouAoEstoque ? "Sim" : "Não"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border px-5 py-4">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingItem && editForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Editar devolução
                </h2>
                <p className="text-sm text-muted-foreground">
                  Corrija os dados do pedido {editingItem.pedido}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditForm(null);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dados principais
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <ProductCombobox
                      products={productOptions}
                      value={editForm.sku}
                      onChange={(sku) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, sku } : prev
                        )
                      }
                      placeholder="Selecionar SKU do produto"
                    />

                    <Input value={editForm.produtoNome} placeholder="Produto" disabled />

                    <select
                      value={editForm.empresa}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, empresa: e.target.value as EmpresaResponsavel }
                            : prev
                        )
                      }
                      className={fieldClass}
                    >
                      <option value="">Empresa responsável</option>
                      {empresaOptions
                        .filter(Boolean)
                        .map((empresa) => (
                          <option key={empresa} value={empresa}>
                            {empresa}
                          </option>
                        ))}
                    </select>

                    <select
                      value={editForm.marketplace}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, marketplace: e.target.value } : prev
                        )
                      }
                      className={fieldClass}
                    >
                      <option value="">Marketplace</option>
                      {marketplaceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <DatePickerField
                      value={editForm.data}
                      onChange={(value) =>
                        setEditForm((prev) => (prev ? { ...prev, data: value } : prev))
                      }
                      placeholder="Data da devolução"
                    />

                    <Input
                      value={editForm.pedido}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, pedido: e.target.value } : prev
                        )
                      }
                      placeholder="Pedido"
                    />

                    <Input
                      value={editForm.motivo}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, motivo: e.target.value } : prev
                        )
                      }
                      placeholder="Motivo da devolução"
                    />

                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.valor}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, valor: e.target.value } : prev
                        )
                      }
                      placeholder="Valor da devolução"
                    />

                    <div className="md:col-span-2">
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, status: e.target.value as DevolucaoStatus }
                              : prev
                          )
                        }
                        className={fieldClass}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recebimento e conferência
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Input
                      value={editForm.responsavelRecebimento}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, responsavelRecebimento: e.target.value }
                            : prev
                        )
                      }
                      placeholder="Responsável pelo recebimento"
                    />

                    <DatePickerField
                      value={editForm.dataRecebimento}
                      onChange={(value) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, dataRecebimento: value } : prev
                        )
                      }
                      placeholder="Data de recebimento"
                    />

                    <Input
                      value={editForm.responsavelConferencia}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, responsavelConferencia: e.target.value }
                            : prev
                        )
                      }
                      placeholder="Responsável pela conferência"
                    />

                    <DatePickerField
                      value={editForm.dataConferencia}
                      onChange={(value) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, dataConferencia: value } : prev
                        )
                      }
                      placeholder="Data de conferência"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Destino do produto
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <select
                      value={editForm.destinoFinal}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, destinoFinal: e.target.value as DestinoFinal }
                            : prev
                        )
                      }
                      className={fieldClass}
                    >
                      <option value="">Destino final</option>
                      {destinoOptions.filter(Boolean).map((destino) => (
                        <option key={destino} value={destino}>
                          {destino}
                        </option>
                      ))}
                    </select>

                    <div className="md:col-span-2 xl:col-span-3">
                      <Input
                        value={editForm.motivoDestino}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, motivoDestino: e.target.value } : prev
                          )
                        }
                        placeholder="Motivo do destino"
                      />
                    </div>

                    <CheckField
                      checked={editForm.avariaConfirmada}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, avariaConfirmada: checked } : prev
                        )
                      }
                      label="Avaria confirmada"
                    />

                    <CheckField
                      checked={editForm.retornouAoEstoque}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, retornouAoEstoque: checked } : prev
                        )
                      }
                      label="Retornou ao estoque"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Observações e controle
                  </p>
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    <Textarea
                      value={editForm.observacoes}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, observacoes: e.target.value } : prev
                        )
                      }
                      placeholder="Observações"
                      className="min-h-[120px]"
                    />

                    <div className="grid grid-cols-1 gap-3 content-start">
                      <CheckField
                        checked={editForm.confirmada}
                        onCheckedChange={(checked) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, confirmada: checked } : prev
                          )
                        }
                        label="Devolução confirmada"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingItem(null);
                  setEditForm(null);
                }}
              >
                Cancelar
              </Button>

              <Button onClick={handleSaveEdit} disabled={savingEdit} className="gap-2">
                <Save className="h-4 w-4" />
                {savingEdit ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCombobox({
  products,
  value,
  onChange,
  placeholder = "Selecionar produto",
}: {
  products: ProductOption[];
  value: string;
  onChange: (sku: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) => product.sku.trim().toLowerCase() === value.trim().toLowerCase()
    );
  }, [products, value]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) => {
      const sku = product.sku.toLowerCase();
      const name = product.name.toLowerCase();
      return sku.includes(term) || name.includes(term);
    });
  }, [products, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between rounded-lg border-border bg-background px-3 font-normal hover:bg-background",
            !selectedProduct && "text-muted-foreground"
          )}
        >
          <span className="truncate text-left">
            {selectedProduct
              ? `${selectedProduct.sku} — ${selectedProduct.name}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por SKU ou nome..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-72">
            {filteredProducts.length === 0 ? (
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredProducts.map((product) => {
                  const isSelected =
                    product.sku.trim().toLowerCase() === value.trim().toLowerCase();

                  return (
                    <CommandItem
                      key={product.sku}
                      value={`${product.sku} ${product.name}`}
                      onSelect={() => {
                        onChange(product.sku);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{product.sku}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {product.name}
                        </p>
                      </div>

                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const selectedDate = parseDateString(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-start rounded-lg border-border bg-background px-3 text-left font-normal hover:bg-background",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate
            ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(toDateString(date))}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

function CheckField({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
      />
      <span>{label}</span>
    </label>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  compact = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof statColorMap;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 card-hover", statColorMap[tone])}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 font-bold text-foreground",
              compact ? "truncate text-base" : "text-3xl"
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            statIconBgMap[tone]
          )}
        >
          <Icon className={cn("h-5 w-5", statIconColorMap[tone])} />
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          "mt-2 text-base font-semibold text-foreground",
          multiline && "whitespace-pre-wrap break-words leading-6"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MiniDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-base font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}