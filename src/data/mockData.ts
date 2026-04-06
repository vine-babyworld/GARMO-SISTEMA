import productsData from "./products.json";
import type { Product, DashboardStats } from "@/types/pricing";

export const products: Product[] = productsData as Product[];

export function buildDashboardStats(productList: Product[]): DashboardStats {
  return {
    totalProducts: productList.length,
    mlListings: Math.floor(productList.length * 0.74),
    shopeeProducts: Math.floor(productList.length * 0.37),
    globalTax: 12.5,
  };
}

export const dashboardStats: DashboardStats = buildDashboardStats(products);