import * as XLSX from "xlsx";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/types/pricing";

type ImportedProduct = Omit<Product, "id">;

type ImportSummary = {
  totalRowsRead: number;
  validRows: number;
  created: number;
  updated: number;
  skipped: number;
  conflicts: number;
  duplicateRowsRemoved: number;
};

const productsRef = collection(db, "products");

function normalizeSku(value: unknown) {
  return String(value ?? "")
    .replace(/\u00A0/g, " ")
    .trim()
    .toLowerCase();
}

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\u00A0/g, " ").trim();

  // remove ".0" de valores numéricos vindos do Excel, comum em SKU/NCM
  if (/^\d+\.0+$/.test(text)) {
    return text.replace(/\.0+$/, "");
  }

  return text;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return NaN;

  if (typeof value === "number") return value;

  const normalized = String(value)
    .replace(/\u00A0/g, " ")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return Number(normalized);
}

function sameProduct(a: ImportedProduct, b: ImportedProduct) {
  return (
    a.sku === b.sku &&
    a.name === b.name &&
    a.cost === b.cost &&
    a.icms === b.icms &&
    a.ipi === b.ipi &&
    a.ncm === b.ncm
  );
}

function parseWorksheetToProducts(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    raw: true,
    defval: "",
  });

  const products: ImportedProduct[] = [];
  const conflicts: Array<{ sku: string; items: ImportedProduct[] }> = [];
  let duplicateRowsRemoved = 0;

  const bySku = new Map<string, ImportedProduct[]>();

  // Começa da linha 2 visual (índice 1), ignorando topo/cabeçalho
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];

    const sku = toText(row[0]);
    const name = toText(row[1]);
    const cost = toNumber(row[2]);
    const icms = toNumber(row[3]);
    const ipi = toNumber(row[4]);
    const ncm = toText(row[5]);

    // ignora linhas totalmente vazias
    if (!sku && !name && Number.isNaN(cost) && Number.isNaN(icms) && Number.isNaN(ipi) && !ncm) {
      continue;
    }

    // validação mínima
    if (!sku || !name || Number.isNaN(cost) || Number.isNaN(icms) || Number.isNaN(ipi) || !ncm) {
      continue;
    }

    const item: ImportedProduct = {
      sku,
      name,
      cost,
      icms,
      ipi,
      ncm,
      supplier: "",
      porte: "medio",
    };

    const normalizedSku = normalizeSku(sku);
    const existing = bySku.get(normalizedSku) ?? [];

    if (existing.length === 0) {
      bySku.set(normalizedSku, [item]);
      continue;
    }

    // se for duplicata idêntica, ignora
    const identical = existing.some((x) => sameProduct(x, item));
    if (identical) {
      duplicateRowsRemoved++;
      continue;
    }

    existing.push(item);
    bySku.set(normalizedSku, existing);
  }

  for (const [, items] of bySku.entries()) {
    if (items.length === 1) {
      products.push(items[0]);
    } else {
      conflicts.push({
        sku: items[0].sku,
        items,
      });
    }
  }

  return {
    products,
    conflicts,
    totalRowsRead: rows.length - 1,
    duplicateRowsRemoved,
  };
}

async function findExistingProductBySku(sku: string) {
  const skuNormalized = normalizeSku(sku);
  const q = query(productsRef, where("skuNormalized", "==", skuNormalized));
  const snapshot = await getDocs(q);
  return snapshot.docs[0] ?? null;
}

export async function runOneTimeProductsImport(file: File): Promise<ImportSummary> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheet = workbook.Sheets["PRODUTOS"];
  if (!sheet) {
    throw new Error('A aba "PRODUTOS" não foi encontrada no arquivo.');
  }

  const parsed = parseWorksheetToProducts(sheet);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of parsed.products) {
    try {
      const existingDoc = await findExistingProductBySku(product.sku);
      const payload = {
        ...product,
        skuNormalized: normalizeSku(product.sku),
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        await updateDoc(doc(db, "products", existingDoc.id), payload);
        updated++;
      } else {
        await addDoc(productsRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        created++;
      }
    } catch (error) {
      console.error("Erro ao importar SKU:", product.sku, error);
      skipped++;
    }
  }

  return {
    totalRowsRead: parsed.totalRowsRead,
    validRows: parsed.products.length,
    created,
    updated,
    skipped,
    conflicts: parsed.conflicts.length,
    duplicateRowsRemoved: parsed.duplicateRowsRemoved,
  };
}