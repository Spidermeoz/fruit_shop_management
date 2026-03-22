import type {
  ProductTagRepository,
  UpdateProductTagPatch,
} from "../../../domain/products/ProductTagRepository";

export class EditProductTag {
  constructor(private repo: ProductTagRepository) {}

  async execute(id: number, patch: UpdateProductTagPatch) {
    const updated = await this.repo.update(id, patch);
    return { id: updated.id! };
  }
}
