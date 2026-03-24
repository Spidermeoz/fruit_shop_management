import type { Product } from "../types/products";

export function summarizeProducts(products: Product[]) {
  const total = products.length;

  const getStock = (p: Product) => {
    if (typeof p.totalStock === "number") return p.totalStock;

    if (Array.isArray(p.variants) && p.variants.length > 0) {
      return p.variants.reduce((sum, variant) => {
        return (
          sum +
          Number(
            variant.availableStock ??
              variant.inventory?.availableQuantity ??
              variant.stock ??
              0,
          )
        );
      }, 0);
    }

    return typeof p.stock === "number" ? p.stock : 0;
  };

  const getUnitPrice = (p: Product) => {
    if (typeof p.effective_price === "number") return p.effective_price;
    if (p.priceRange?.min !== undefined) return p.priceRange.min;
    return p.price ?? 0;
  };

  const outOfStock = products.filter((p) => getStock(p) === 0).length;

  const lowStock = products.filter((p) => {
    const stock = getStock(p);
    return stock > 0 && stock < 20;
  }).length;

  const totalInventoryValue = products.reduce((sum, p) => {
    return sum + getStock(p) * getUnitPrice(p);
  }, 0);

  return {
    total,
    outOfStock,
    lowStock,
    totalInventoryValue,
  };
}
