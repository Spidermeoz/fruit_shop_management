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

    const normalizedOptions =
      patch.options !== undefined
        ? patch.options.map((option, optionIndex) => ({
            id: option.id,
            name: String(option.name ?? "").trim(),
            position: option.position ?? optionIndex,
            values: Array.isArray(option.values)
              ? option.values.map((value, valueIndex) => ({
                  id: value.id,
                  value: String(value.value ?? "").trim(),
                  position: value.position ?? valueIndex,
                }))
              : [],
          }))
        : existingProduct.props.options;

    const normalizedVariants =
      patch.variants !== undefined
        ? patch.variants.map((variant, index) => ({
            id: variant.id,
            sku: variant.sku ?? null,
            title: variant.title ?? null,
            price: Number(variant.price ?? 0),
            compareAtPrice:
              variant.compareAtPrice !== undefined &&
              variant.compareAtPrice !== null
                ? Number(variant.compareAtPrice)
                : null,
            stock: Number(variant.stock ?? 0),
            status: variant.status ?? "active",
            sortOrder: variant.sortOrder ?? index,
            optionValueIds: Array.isArray(variant.optionValueIds)
              ? variant.optionValueIds.map(Number)
              : [],
            optionValues: Array.isArray((variant as any).optionValues)
              ? (variant as any).optionValues.map((ov: any) => ({
                  id: ov.id,
                  value: String(ov.value ?? "").trim(),
                  optionId:
                    ov.optionId !== undefined && ov.optionId !== null
                      ? Number(ov.optionId)
                      : undefined,
                  optionName: String(ov.optionName ?? "").trim(),
                  position:
                    ov.position !== undefined && ov.position !== null
                      ? Number(ov.position)
                      : undefined,
                }))
              : [],
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
      title:
        patch.title !== undefined
          ? String(patch.title).trim()
          : existingProduct.props.title,

      // summary / compatibility field
      stock: totalVariantStock,

      options: normalizedOptions,
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
