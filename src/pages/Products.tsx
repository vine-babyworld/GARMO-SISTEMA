import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, Save, X } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DraftProduct = {
  sku: string;
  name: string;
  supplier: string;
  cost: string;
  icms: string;
  ipi: string;
  ncm: string;
  porte: Product["porte"];
};

type DraftErrors = Partial<Record<keyof DraftProduct, string>>;

const ITEMS_PER_PAGE = 40;

function normalizeSku(value: string) {
  return value.trim().toLowerCase();
}

function toPercentNumber(value: number) {
  return Number((value * 100).toFixed(2));
}

function formatCurrency(value: number | string | null | undefined) {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isNaN(numericValue) ? 0 : numericValue);
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

function getPorteBadgeClasses(porte: Product["porte"]) {
  switch (porte) {
    case "pequeno":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "medio":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "grande":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "extra_grande":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function createDraft(product?: Product): DraftProduct {
  return {
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    supplier: product?.supplier ?? "",
    cost: product ? String(product.cost ?? "") : "",
    icms: product ? String(toPercentNumber(product.icms ?? 0)) : "",
    ipi: product ? String(toPercentNumber(product.ipi ?? 0)) : "",
    ncm: product?.ncm ?? "",
    porte: product?.porte ?? "medio",
  };
}

function parseDecimal(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return NaN;
  return Number(normalized);
}

function validateDraft(
  draft: DraftProduct,
  existingProducts: Product[],
  currentProductId?: string
): DraftErrors {
  const errors: DraftErrors = {};

  const normalizedDraftSku = normalizeSku(draft.sku);

  if (!draft.sku.trim()) {
    errors.sku = "SKU é obrigatório";
  } else {
    const duplicatedSku = existingProducts.some((product) => {
      if (currentProductId && product.id === currentProductId) return false;
      return normalizeSku(product.sku) === normalizedDraftSku;
    });

    if (duplicatedSku) {
      errors.sku = "Este SKU já foi cadastrado";
    }
  }

  if (!draft.name.trim()) errors.name = "Produto é obrigatório";
  if (!draft.ncm.trim()) errors.ncm = "NCM é obrigatório";
  if (!draft.porte) errors.porte = "Porte é obrigatório";

  const cost = parseDecimal(draft.cost);
  const icms = parseDecimal(draft.icms);
  const ipi = parseDecimal(draft.ipi);

  if (draft.cost.trim() === "" || Number.isNaN(cost) || cost < 0) {
    errors.cost = "Custo inválido";
  }

  if (draft.icms.trim() === "" || Number.isNaN(icms) || icms < 0) {
    errors.icms = "ICMS inválido";
  }

  if (draft.ipi.trim() === "" || Number.isNaN(ipi) || ipi < 0) {
    errors.ipi = "IPI inválido";
  }

  return errors;
}

function buildPayload(draft: DraftProduct): Omit<Product, "id"> {
  return {
    sku: draft.sku.trim(),
    name: draft.name.trim(),
    supplier: draft.supplier.trim(),
    cost: parseDecimal(draft.cost),
    icms: parseDecimal(draft.icms) / 100,
    ipi: parseDecimal(draft.ipi) / 100,
    ncm: draft.ncm.trim(),
    porte: draft.porte,
  };
}

type ProductFormModalProps = {
  open: boolean;
  title: string;
  description: string;
  draft: DraftProduct;
  errors: DraftErrors;
  saving: boolean;
  availableSuppliers: string[];
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof DraftProduct, value: string | Product["porte"]) => void;
};

function ProductFormModal({
  open,
  title,
  description,
  draft,
  errors,
  saving,
  availableSuppliers,
  onClose,
  onSave,
  onChange,
}: ProductFormModalProps) {
  if (!open) return null;

  function renderError(error?: string) {
    if (!error) return null;
    return <p className="mt-1 text-xs text-destructive">{error}</p>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">SKU</label>
              <Input
                value={draft.sku}
                onChange={(e) => onChange("sku", e.target.value)}
                placeholder="SKU"
              />
              {renderError(errors.sku)}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Fornecedor</label>
              <Input
                list="suppliers-list"
                value={draft.supplier}
                onChange={(e) => onChange("supplier", e.target.value)}
                placeholder="Opcional"
              />
              <datalist id="suppliers-list">
                {availableSuppliers.map((supplier) => (
                  <option key={supplier} value={supplier} />
                ))}
              </datalist>
              {renderError(errors.supplier)}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-foreground">Produto</label>
              <Input
                value={draft.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Nome do produto"
              />
              {renderError(errors.name)}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Custo</label>
              <Input
                inputMode="decimal"
                value={draft.cost}
                onChange={(e) => onChange("cost", e.target.value)}
                placeholder="0,00"
              />
              {renderError(errors.cost)}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">NCM</label>
              <Input
                value={draft.ncm}
                onChange={(e) => onChange("ncm", e.target.value)}
                placeholder="NCM"
              />
              {renderError(errors.ncm)}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">ICMS %</label>
              <Input
                inputMode="decimal"
                value={draft.icms}
                onChange={(e) => onChange("icms", e.target.value)}
                placeholder="0"
              />
              {renderError(errors.icms)}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">IPI %</label>
              <Input
                inputMode="decimal"
                value={draft.ipi}
                onChange={(e) => onChange("ipi", e.target.value)}
                placeholder="0"
              />
              {renderError(errors.ipi)}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-foreground">Porte</label>
              <select
                value={draft.porte}
                onChange={(e) => onChange("porte", e.target.value as Product["porte"])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pequeno">Pequeno</option>
                <option value="medio">Médio</option>
                <option value="grande">Grande</option>
                <option value="extra_grande">Extra Grande</option>
              </select>
              {renderError(errors.porte)}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave} className="gap-2" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

type ProductCardProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
};

function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            SKU
          </div>
          <div className="mt-1 break-all text-sm font-semibold text-foreground">
            {product.sku}
          </div>
        </div>

        <div
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getPorteBadgeClasses(
            product.porte
          )}`}
        >
          {getPorteLabel(product.porte)}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-foreground">{product.name}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {product.supplier || "Sem fornecedor"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-secondary/40 p-3">
          <div className="text-xs text-muted-foreground">Custo</div>
          <div className="mt-1 text-sm font-medium">{formatCurrency(product.cost)}</div>
        </div>

        <div className="rounded-lg bg-secondary/40 p-3">
          <div className="text-xs text-muted-foreground">ICMS</div>
          <div className="mt-1 text-sm font-medium">{toPercentNumber(product.icms)}%</div>
        </div>

        <div className="rounded-lg bg-secondary/40 p-3">
          <div className="text-xs text-muted-foreground">IPI</div>
          <div className="mt-1 text-sm font-medium">{toPercentNumber(product.ipi)}%</div>
        </div>

        <div className="rounded-lg bg-secondary/40 p-3">
          <div className="text-xs text-muted-foreground">NCM</div>
          <div className="mt-1 break-all text-sm font-medium">{product.ncm}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(product)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(product.id)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

export default function Products() {
  const { rawProducts, addProduct, updateProduct, deleteProduct } = useProducts();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [porteFilter, setPorteFilter] = useState<"todos" | Product["porte"]>("todos");
  const [supplierFilter, setSupplierFilter] = useState("todos");

  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const [savingNew, setSavingNew] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDraft, setNewDraft] = useState<DraftProduct>(createDraft());
  const [newErrors, setNewErrors] = useState<DraftErrors>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<DraftProduct>(createDraft());
  const [editingErrors, setEditingErrors] = useState<DraftErrors>({});

  const supplierOptions = useMemo(() => {
    return [...new Set(rawProducts.map((p) => (p.supplier || "").trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );
  }, [rawProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    const sortedProducts = [...rawProducts].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
    );

    return sortedProducts.filter((product) => {
      const matchesSearch =
        !q ||
        product.sku.toLowerCase().includes(q) ||
        product.name.toLowerCase().includes(q) ||
        (product.supplier || "").toLowerCase().includes(q);

      const matchesPorte = porteFilter === "todos" || product.porte === porteFilter;

      const matchesSupplier =
        supplierFilter === "todos" || (product.supplier || "").trim() === supplierFilter;

      return matchesSearch && matchesPorte && matchesSupplier;
    });
  }, [rawProducts, search, porteFilter, supplierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, porteFilter, supplierFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const deleteProductName =
    deleteProductId !== null
      ? rawProducts.find((p) => p.id === deleteProductId)?.name || ""
      : "";

  function openCreateModal() {
    setNewDraft(createDraft());
    setNewErrors({});
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
    setNewErrors({});
  }

  async function saveNewProduct() {
    const errors = validateDraft(newDraft, rawProducts);
    setNewErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      setSavingNew(true);
      await addProduct(buildPayload(newDraft));
      setIsCreateModalOpen(false);
      setNewDraft(createDraft());
      setNewErrors({});
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setNewErrors((prev) => ({
        ...prev,
        sku: "Não foi possível salvar. Verifique se o SKU já existe.",
      }));
    } finally {
      setSavingNew(false);
    }
  }

  function openEditModal(product: Product) {
    setEditingId(product.id);
    setEditingDraft(createDraft(product));
    setEditingErrors({});
  }

  function closeEditModal() {
    setEditingId(null);
    setEditingDraft(createDraft());
    setEditingErrors({});
  }

  async function saveEditProduct() {
    if (!editingId) return;

    const errors = validateDraft(editingDraft, rawProducts, editingId);
    setEditingErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      setSavingEdit(true);
      await updateProduct(editingId, buildPayload(editingDraft));
      setEditingId(null);
      setEditingDraft(createDraft());
      setEditingErrors({});
    } catch (error) {
      console.error(error);
      setEditingErrors((prev) => ({
        ...prev,
        sku: "Não foi possível salvar. Verifique se o SKU já existe.",
      }));
    } finally {
      setSavingEdit(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setPorteFilter("todos");
    setSupplierFilter("todos");
  }

  function renderPaginationButtons() {
    const pageNumbers: number[] = [];

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i += 1) {
      pageNumbers.push(i);
    }

    return pageNumbers.map((page) => (
      <Button
        key={page}
        variant={page === currentPage ? "default" : "outline"}
        size="sm"
        onClick={() => setCurrentPage(page)}
      >
        {page}
      </Button>
    ));
  }

  return (
    <div className="animate-fade-in space-y-5 p-1 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cadastro de Produtos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pesquise, filtre, cadastre, edite e exclua produtos de forma mais leve.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar produto
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por SKU, nome ou fornecedor"
              className="pl-9"
            />
          </div>

          <select
            value={porteFilter}
            onChange={(e) => setPorteFilter(e.target.value as "todos" | Product["porte"])}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="todos">Todos os portes</option>
            <option value="pequeno">Pequeno</option>
            <option value="medio">Médio</option>
            <option value="grande">Grande</option>
            <option value="extra_grande">Extra Grande</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="todos">Todos os fornecedores</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>

        <div className="mt-3 text-sm text-muted-foreground">
          {filteredProducts.length} produto(s)
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={openEditModal}
                onDelete={(productId) => {
                  setDeleteProductId(productId);
                  setConfirmText("");
                }}
              />
            ))}
          </div>

          <div className="hidden rounded-xl border border-border bg-card lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">SKU</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">Produto</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">Fornecedor</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">Custo</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">ICMS %</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">IPI %</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">NCM</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">Porte</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border/50 align-middle transition-colors hover:bg-secondary/20"
                    >
                      <td className="px-3 py-3">
                        <div className="max-w-[120px] truncate font-medium">{product.sku}</div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="max-w-[280px] whitespace-normal break-words">
                          {product.name}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="max-w-[180px] whitespace-normal break-words text-muted-foreground">
                          {product.supplier || "—"}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right font-mono">
                        {formatCurrency(product.cost)}
                      </td>

                      <td className="px-3 py-3 text-right font-mono">
                        {toPercentNumber(product.icms)}%
                      </td>

                      <td className="px-3 py-3 text-right font-mono">
                        {toPercentNumber(product.ipi)}%
                      </td>

                      <td className="px-3 py-3">
                        <div className="max-w-[120px] truncate">{product.ncm}</div>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getPorteBadgeClasses(
                            product.porte
                          )}`}
                        >
                          {getPorteLabel(product.porte)}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(product)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteProductId(product.id);
                              setConfirmText("");
                            }}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>

                {renderPaginationButtons()}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <ProductFormModal
        open={isCreateModalOpen}
        title="Adicionar produto"
        description="Preencha os campos abaixo para cadastrar um novo produto."
        draft={newDraft}
        errors={newErrors}
        saving={savingNew}
        availableSuppliers={supplierOptions}
        onClose={closeCreateModal}
        onSave={saveNewProduct}
        onChange={(field, value) =>
          setNewDraft((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
      />

      <ProductFormModal
        open={!!editingId}
        title="Editar produto"
        description="Atualize as informações do produto selecionado."
        draft={editingDraft}
        errors={editingErrors}
        saving={savingEdit}
        availableSuppliers={supplierOptions}
        onClose={closeEditModal}
        onSave={saveEditProduct}
        onChange={(field, value) =>
          setEditingDraft((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
      />

      <AlertDialog
        open={deleteProductId !== null}
        onOpenChange={(open) => !open && setDeleteProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita facilmente. Para confirmar, digite
              <span className="mx-1 font-semibold text-foreground">EXCLUIR</span>
              no campo abaixo.
              {deleteProductName ? (
                <>
                  <br />
                  <span className="mt-2 inline-block font-medium text-foreground">
                    Produto: {deleteProductName}
                  </span>
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Digite EXCLUIR"
          />

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProductId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== "EXCLUIR" || deleteProductId === null}
              onClick={() => {
                if (deleteProductId && confirmText === "EXCLUIR") {
                  deleteProduct(deleteProductId);
                }
                setDeleteProductId(null);
                setConfirmText("");
              }}
            >
              Confirmar exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}