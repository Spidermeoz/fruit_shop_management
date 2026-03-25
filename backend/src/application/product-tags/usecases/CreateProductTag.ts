import type {
  CreateProductTagInput,
  ProductTagRepository,
} from "../../../domain/products/ProductTagRepository";

export class CreateProductTag {
  constructor(private repo: ProductTagRepository) {}

  async execute(input: CreateProductTagInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new Error("Name is required");
    }

    if (
      input.productTagGroupId === undefined ||
      input.productTagGroupId === null ||
      !Number.isInteger(Number(input.productTagGroupId)) ||
      Number(input.productTagGroupId) <= 0
    ) {
      throw new Error("Product tag group is required");
    }

    const created = await this.repo.create({
      name,
      slug: input.slug?.trim() || null,
      productTagGroupId: Number(input.productTagGroupId),
    });

    return { id: created.id! };
  }
}
