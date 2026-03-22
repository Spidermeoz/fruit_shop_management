import type { OriginRepository } from "../../../domain/products/OriginRepository";
import { toDTO } from "../dto";

export class GetOriginDetail {
  constructor(private repo: OriginRepository) {}

  async execute(id: number) {
    const origin = await this.repo.findById(id);
    if (!origin) throw new Error("Origin not found");
    return toDTO(origin);
  }
}
