import type { PostRepository } from "../../../domain/posts/PostRepository";

export class IncreasePostViewCount {
  constructor(private repo: PostRepository) {}

  async execute(id: number) {
    const postId = Number(id);

    if (!Number.isInteger(postId) || postId <= 0) {
      throw new Error("Post id is invalid");
    }

    const existingPost = await this.repo.findById(postId);

    if (!existingPost || existingPost.props.deleted) {
      throw new Error("Post not found");
    }

    if (existingPost.props.status !== "published") {
      throw new Error("Post not found");
    }

    await this.repo.increaseViewCount(postId);

    const updatedPost = await this.repo.findById(postId);

    if (!updatedPost || updatedPost.props.deleted) {
      throw new Error("Post not found");
    }

    return {
      id: postId,
      viewCount: Number(updatedPost.props.viewCount ?? 0),
    };
  }
}
