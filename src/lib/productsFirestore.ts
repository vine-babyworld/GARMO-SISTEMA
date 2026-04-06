import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/types/pricing";

const productsRef = collection(db, "products");

type FirestoreProduct = Omit<Product, "id"> & {
  skuNormalized?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function normalizeSku(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

function sanitizeProduct(product: Omit<Product, "id">): Omit<Product, "id"> {
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

async function findProductsByNormalizedSku(sku: string) {
  const normalizedSku = normalizeSku(sku);

  const q = query(productsRef, where("skuNormalized", "==", normalizedSku));

  return await getDocs(q);
}

export async function fetchProducts(): Promise<Product[]> {
  const q = query(productsRef, orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data() as FirestoreProduct;

    return {
      id: d.id,
      sku: String(data.sku ?? ""),
      name: String(data.name ?? ""),
      cost: Number(data.cost ?? 0),
      icms: Number(data.icms ?? 0),
      ipi: Number(data.ipi ?? 0),
      ncm: String(data.ncm ?? ""),
      supplier: String(data.supplier ?? ""),
      porte: (data.porte as Product["porte"]) ?? "medio",
    };
  });
}

export async function createProduct(
  product: Omit<Product, "id">
): Promise<void> {
  const sanitizedProduct = sanitizeProduct(product);
  const normalizedSku = normalizeSku(sanitizedProduct.sku);

  if (!normalizedSku) {
    throw new Error("SKU_REQUIRED");
  }

  const existingSnapshot = await findProductsByNormalizedSku(
    sanitizedProduct.sku
  );

  if (!existingSnapshot.empty) {
    throw new Error("SKU_DUPLICATE");
  }

  await addDoc(productsRef, {
    ...sanitizedProduct,
    skuNormalized: normalizedSku,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function editProduct(
  productId: string,
  patch: Partial<Omit<Product, "id">>
): Promise<void> {
  const ref = doc(db, "products", productId);

  const cleanPatch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (patch.sku !== undefined) {
    const sku = String(patch.sku ?? "").trim();
    const normalizedSku = normalizeSku(sku);

    if (!normalizedSku) {
      throw new Error("SKU_REQUIRED");
    }

    const existingSnapshot = await findProductsByNormalizedSku(sku);
    const duplicated = existingSnapshot.docs.some((d) => d.id !== productId);

    if (duplicated) {
      throw new Error("SKU_DUPLICATE");
    }

    cleanPatch.sku = sku;
    cleanPatch.skuNormalized = normalizedSku;
  }

  if (patch.name !== undefined) cleanPatch.name = String(patch.name ?? "").trim();
  if (patch.cost !== undefined) cleanPatch.cost = Number(patch.cost ?? 0);
  if (patch.icms !== undefined) cleanPatch.icms = Number(patch.icms ?? 0);
  if (patch.ipi !== undefined) cleanPatch.ipi = Number(patch.ipi ?? 0);
  if (patch.ncm !== undefined) cleanPatch.ncm = String(patch.ncm ?? "").trim();
  if (patch.supplier !== undefined) cleanPatch.supplier = String(patch.supplier ?? "").trim();
  if (patch.porte !== undefined) cleanPatch.porte = patch.porte ?? "medio";

  await updateDoc(ref, cleanPatch);
}

export async function removeProduct(productId: string): Promise<void> {
  const ref = doc(db, "products", productId);
  await deleteDoc(ref);
}