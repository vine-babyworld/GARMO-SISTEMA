import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/pricing";
import {
  createProduct,
  editProduct,
  fetchProducts,
  removeProduct,
} from "@/lib/productsFirestore";

function normalizeProduct(product: Partial<Product>): Product {
  return {
    id: String(product.id ?? ""),
    sku: String(product.sku ?? ""),
    name: String(product.name ?? ""),
    cost: Number(product.cost ?? 0),
    icms: Number(product.icms ?? 0),
    ipi: Number(product.ipi ?? 0),
    ncm: String(product.ncm ?? ""),
    supplier: String(product.supplier ?? ""),
    porte: (product.porte as Product["porte"]) ?? "medio",
  };
}

function sanitizeProductPayload(product: Partial<Product>) {
  return {
    sku: String(product.sku ?? "").trim(),
    name: String(product.name ?? "").trim(),
    cost: Number(product.cost ?? 0),
    icms: Number(product.icms ?? 0),
    ipi: Number(product.ipi ?? 0),
    ncm: String(product.ncm ?? "").trim(),
    supplier: String(product.supplier ?? "").trim(),
    porte: (product.porte as Product["porte"]) ?? "medio",
  };
}

function normalizeSku(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data.map(normalizeProduct));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [products]);

  const addProduct = useCallback(
    async (product?: Partial<Product>) => {
      const payload = sanitizeProductPayload({
        sku: "",
        name: "",
        cost: 0,
        icms: 0,
        ipi: 0,
        ncm: "",
        supplier: "",
        porte: "medio",
        ...product,
      });

      const skuAlreadyExists = products.some(
        (item) => normalizeSku(item.sku) === normalizeSku(payload.sku)
      );

      if (skuAlreadyExists) {
        throw new Error("SKU_DUPLICATE");
      }

      await createProduct(payload);
      await loadProducts();
    },
    [products, loadProducts]
  );

  const updateProduct = useCallback(
    async (productId: string, patch: Partial<Product>) => {
      const { id, ...rest } = patch;
      void id;

      const cleanPatch = sanitizeProductPayload(rest);

      const skuAlreadyExists = products.some(
        (item) =>
          item.id !== productId &&
          normalizeSku(item.sku) === normalizeSku(cleanPatch.sku)
      );

      if (skuAlreadyExists) {
        throw new Error("SKU_DUPLICATE");
      }

      await editProduct(productId, cleanPatch);
      await loadProducts();
    },
    [products, loadProducts]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      await removeProduct(productId);
      await loadProducts();
    },
    [loadProducts]
  );

  return {
    products: sortedProducts,
    rawProducts: products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    reloadProducts: loadProducts,
  };
}