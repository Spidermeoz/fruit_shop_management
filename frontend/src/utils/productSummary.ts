import type { Product } from "../types/products";

export function summarizeProducts(products: Product[]) {
  const total = products.length;

  const outOfStock = products.filter(p => p.stock === 0).length;

  const lowStock = products.filter(p => p.stock > 0 && p.stock < 20).length;

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stock * (p.effective_price ?? p.price),
    0
  );

  return {
    total,
    outOfStock,
    lowStock,
    totalInventoryValue,
  };
}
