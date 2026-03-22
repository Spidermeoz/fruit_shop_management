import type {
  OriginRepository,
  UpdateOriginPatch,
} from "../../../domain/products/OriginRepository";

export class EditOrigin {
  constructor(private repo: OriginRepository) {}

  async execute(id: number, patch: UpdateOriginPatch) {
    const updated = await this.repo.update(id, patch);
    return { id: updated.id! };
  }
}
