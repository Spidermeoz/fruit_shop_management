import type {
  OriginRepository,
  OriginStatus,
} from "../../../domain/products/OriginRepository";

export class ChangeOriginStatus {
  constructor(private repo: OriginRepository) {}

  async execute(id: number, status: OriginStatus) {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new Error("Origin not found");
    }

    await this.repo.changeStatus(id, status);

    return { id };
  }
}
