import { Product } from "../../../domain/products/Products";
import type {
  ProductRepository,
  UpdateProductPatch,
} from "../../../domain/products/ProductRepository";

export class EditProduct {
  constructor(
    private repo: ProductRepository,
    private inventoryRepo: any,
  ) {}

  async execute(id: number, patch: UpdateProductPatch) {
    const existingProduct = await this.repo.findById(id);

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    const normalizedVariants =
      patch.variants !== undefined
        ? patch.variants.map((variant, index) => ({
            id: variant.id,
            sku: variant.sku ?? null,
            title: variant.title ?? null,
            price: Number(variant.price ?? 0),
            compareAtPrice:
              variant.compareAtPrice !== undefined
                ? variant.compareAtPrice
                : null,
            stock: Number(variant.stock ?? 0),
            status: variant.status ?? "active",
            sortOrder: variant.sortOrder ?? index,
            optionValueIds: variant.optionValueIds ?? [],
          }))
        : existingProduct.props.variants;

    const totalVariantStock = Array.isArray(normalizedVariants)
      ? normalizedVariants.reduce(
          (sum, variant) => sum + Number(variant.stock ?? 0),
          0,
        )
      : Number(existingProduct.props.stock ?? 0);

    const updatedProduct = Product.create({
      ...existingProduct.props,
      ...patch,
      stock: totalVariantStock,
      variants: normalizedVariants,
    });

    const saved = await this.repo.update(id, updatedProduct.props);

    const fresh = await this.repo.findById(id);

    if (fresh && Array.isArray(fresh.props.variants)) {
      for (const variant of fresh.props.variants) {
        await this.inventoryRepo.setStockByVariantId(
          Number(variant.id),
          Number(variant.stock ?? 0),
          {
            transactionType: "manual_update",
            referenceType: "product_edit",
            referenceId: Number(id),
            note: `Sync inventory từ product edit ${fresh.props.title}`,
            createdById: fresh.props.updatedById ?? null,
          },
        );
      }

      await this.inventoryRepo.recalculateProductStockFromVariants(Number(id));
    }

    return { id: saved.props.id! };
  }
}
