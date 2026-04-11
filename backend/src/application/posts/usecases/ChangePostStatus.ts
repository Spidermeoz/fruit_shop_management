import type { PostRepository } from "../../../domain/posts/PostRepository";
import { isPostStatus, type PostStatus } from "../../../domain/posts/types";

function hasMeaningfulContent(content?: string | null) {
  const text = String(content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0;
}

export class ChangePostStatus {
  constructor(private repo: PostRepository) {}

  async execute(id: number, status: PostStatus) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new Error("Post id is invalid");
    }

    if (!isPostStatus(status)) {
      throw new Error("Post status is invalid");
    }

    const existingPost = await this.repo.findById(Number(id));
    if (!existingPost) {
      throw new Error("Post not found");
    }

    if (status === "published") {
      if (!existingPost.props.title?.trim()) {
        throw new Error("Published post must have title");
      }

      if (!existingPost.props.slug?.trim()) {
        throw new Error("Published post must have a valid slug");
      }

      if (!hasMeaningfulContent(existingPost.props.content)) {
        throw new Error("Published post must have content");
      }
    }

    await this.repo.changeStatus(Number(id), status);
    return { id: Number(id), status };
  }
}
