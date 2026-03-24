import type {
  CreateProductInput,
  ProductRepository,
} from "../../../domain/products/ProductRepository";

export class CreateProduct {
  constructor(
    private repo: ProductRepository,
    private inventoryRepo: any,
  ) {}

  async execute(input: CreateProductInput) {
    if (!input.title?.trim()) {
      throw new Error("Title is required");
    }

    const normalizedOptions = Array.isArray(input.options)
      ? input.options.map((option, optionIndex) => ({
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
      : [];

    const normalizedVariants = Array.isArray(input.variants)
      ? input.variants.map((variant, index) => ({
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
          optionValues: Array.isArray(variant.optionValues)
            ? variant.optionValues.map((ov) => ({
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
      : [];

    const totalVariantStock = normalizedVariants.reduce(
      (sum, variant) => sum + Number(variant.stock ?? 0),
      0,
    );

    const created = await this.repo.create({
      ...input,
      title: input.title.trim(),

      // product-level stock chỉ là derived / compatibility
      stock:
        normalizedVariants.length > 0
          ? totalVariantStock
          : Number(input.stock ?? 0),

      options: normalizedOptions,
      variants: normalizedVariants,
      status: input.status ?? "active",
      featured: !!input.featured,
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
