import type {
  ProductRepository,
  CreateProductInput,
} from "../../../domain/products/ProductRepository";

export class CreateProduct {
  constructor(
    private repo: ProductRepository,
    private inventoryRepo: any,
  ) {}

  async execute(input: CreateProductInput) {
    if (!input.title?.trim()) throw new Error("Title is required");

    const normalizedVariants = Array.isArray(input.variants)
      ? input.variants.map((variant, index) => ({
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
      : [];

    const totalVariantStock = normalizedVariants.reduce(
      (sum, variant) => sum + Number(variant.stock ?? 0),
      0,
    );

    const created = await this.repo.create({
      ...input,
      status: input.status ?? "active",
      stock:
        normalizedVariants.length > 0
          ? totalVariantStock
          : Number(input.stock ?? 0),
      variants:
        normalizedVariants.length > 0 ? normalizedVariants : input.variants,
    });

    const fresh = await this.repo.findById(Number(created.props.id));

    if (fresh && Array.isArray(fresh.props.variants)) {
      for (const variant of fresh.props.variants) {
        await this.inventoryRepo.ensureStockForVariant(
          Number(variant.id),
          Number(variant.stock ?? 0),
        );
      }

      await this.inventoryRepo.recalculateProductStockFromVariants(
        Number(fresh.props.id),
      );
    }

    return { id: created.props.id! };
  }
}
