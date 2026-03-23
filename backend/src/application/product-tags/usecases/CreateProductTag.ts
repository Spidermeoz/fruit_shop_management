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
      tagGroup: input.tagGroup,
      description: input.description ?? null,
    });

    return { id: created.id! };
  }
}
