import type {
  ProductTagGroupRepository,
  UpdateProductTagGroupPatch,
} from "../../../domain/products/ProductTagGroupRepository";

export class EditProductTagGroup {
  constructor(private repo: ProductTagGroupRepository) {}

  async execute(id: number, patch: UpdateProductTagGroupPatch) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid product tag group id");
    }

    const nextPatch: UpdateProductTagGroupPatch = {};

    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new Error("Name is required");
      nextPatch.name = name;
    }

    if (patch.slug !== undefined) {
      nextPatch.slug = patch.slug?.trim() || null;
    }

    if (patch.deleted !== undefined) {
      nextPatch.deleted = !!patch.deleted;
    }

    const updated = await this.repo.update(id, nextPatch);
    return { id: updated.id! };
  }
}
