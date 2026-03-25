import type {
  CreateProductTagGroupInput,
  ProductTagGroupRepository,
} from "../../../domain/products/ProductTagGroupRepository";

export class CreateProductTagGroup {
  constructor(private repo: ProductTagGroupRepository) {}

  async execute(input: CreateProductTagGroupInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new Error("Name is required");
    }

    const created = await this.repo.create({
      name,
      slug: input.slug?.trim() || null,
    });

    return { id: created.id! };
  }
}
