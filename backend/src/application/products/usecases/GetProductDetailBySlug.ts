import type { ProductRepository } from "../../../domain/products/ProductRepository";
import { toDTO } from "../dto";

export class GetProductDetailBySlug {
  constructor(
    private repo: ProductRepository,
    private inventoryRepo?: any,
  ) {}

  async execute(slug: string) {
    const p = await this.repo.findBySlug(slug);

    if (!p) {
      throw new Error("Product not found");
    }

    const dto = toDTO(p);

    if (
      this.inventoryRepo &&
      Array.isArray(dto.variants) &&
      dto.variants.length > 0
    ) {
      dto.variants = await Promise.all(
        dto.variants.map(async (variant) => {
          const availableStock =
            typeof this.inventoryRepo.getAvailableStockByVariantId ===
            "function"
              ? await this.inventoryRepo.getAvailableStockByVariantId(
                  Number(variant.id),
                  Number(variant.stock ?? 0),
                )
              : (variant.availableStock ?? variant.stock ?? 0);

          return {
            ...variant,
            availableStock,
          };
        }),
      );
    }

    return dto;
  }
}
