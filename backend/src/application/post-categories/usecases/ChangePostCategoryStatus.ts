import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";
import type { PostCategoryStatus } from "../../../domain/post-categories/types";

function isValidStatus(value: any): value is PostCategoryStatus {
  return value === "active" || value === "inactive";
}

export class ChangePostCategoryStatus {
  constructor(private repo: PostCategoryRepository) {}

  async execute(id: number, status: PostCategoryStatus) {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new Error("Post category not found");
    }

    if (!isValidStatus(status)) {
      throw new Error("Status is invalid");
    }

    await this.repo.changeStatus(id, status);
    return { id, status };
  }
}
