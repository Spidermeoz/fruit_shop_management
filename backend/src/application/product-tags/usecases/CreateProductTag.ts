import type {
  CreateProductTagInput,
  ProductTagRepository,
} from "../../../domain/products/ProductTagRepository";

export class CreateProductTag {
  constructor(private repo: ProductTagRepository) {}

  async execute(input: CreateProductTagInput) {
    if (!input.name?.trim()) throw new Error("Name is required");
    if (!input.tagGroup) throw new Error("Tag group is required");

    const created = await this.repo.create({
      name: input.name.trim(),
      slug: input.slug ?? null,
      tagGroup: input.tagGroup,
      description: input.description ?? null,
      status: input.status ?? "active",
      position: input.position ?? null,
    });

    return { id: created.id! };
  }
}
