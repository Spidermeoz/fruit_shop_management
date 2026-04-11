import type { PostRepository } from "../../../domain/posts/PostRepository";

export class GetPostDetailBySlug {
  constructor(private repo: PostRepository) {}

  async execute(slug: string) {
    const normalizedSlug = String(slug ?? "").trim();

    if (!normalizedSlug) {
      throw new Error("Post slug is required");
    }

    const post = await this.repo.findBySlug(normalizedSlug);

    if (!post || post.props.deleted) {
      throw new Error("Post not found");
    }

    if (post.props.status !== "published") {
      throw new Error("Post not found");
    }

    return post.props;
  }
}
