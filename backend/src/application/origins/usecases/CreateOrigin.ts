import type {
  CreateOriginInput,
  OriginRepository,
} from "../../../domain/products/OriginRepository";

export class CreateOrigin {
  constructor(private repo: OriginRepository) {}

  async execute(input: CreateOriginInput) {
    if (!input.name?.trim()) throw new Error("Name is required");

    const created = await this.repo.create({
      name: input.name.trim(),
      description: input.description ?? null,
      countryCode: input.countryCode ?? null,
      status: input.status ?? "active",
      position: input.position ?? null,
    });

    return { id: created.id! };
  }
}
