import { Product } from "../../../domain/products/Products";
import type {
  ProductRepository,
  UpdateProductPatch,
} from "../../../domain/products/ProductRepository";

export class EditProduct {
  constructor(private repo: ProductRepository) {}

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

    const updatedProduct = Product.create({
      ...existingProduct.props,
      ...patch,
      variants: normalizedVariants,
    });

    const saved = await this.repo.update(id, updatedProduct.props);

    return { id: saved.props.id! };
  }
}
