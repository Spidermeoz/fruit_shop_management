import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";

export class GetPostCategoryDetail {
  constructor(private repo: PostCategoryRepository) {}

  async execute(id: number) {
    const category = await this.repo.findById(id);

    if (!category) {
      throw new Error("Post category not found");
    }

    return category.props;
  }
}
