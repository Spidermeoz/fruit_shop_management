// src/application/categories/usecases/CreateCategory.ts
import type { ProductCategoryRepository, CreateCategoryInput } from "../../../domain/categories/ProductCategoryRepository";

export class CreateCategory {
  constructor(private repo: ProductCategoryRepository) {}

  async execute(input: CreateCategoryInput) {
    if (!input.title?.trim()) throw new Error("Title is required");
    const created = await this.repo.create({
      title: input.title.trim(),
      parentId: input.parentId ?? null,
      description: input.description ?? null,
      thumbnail: input.thumbnail ?? null,
      status: input.status ?? "active",
      position: input.position ?? null,
      slug: input.slug ?? null,
    });
    return { id: created.props.id! };
  }
}
