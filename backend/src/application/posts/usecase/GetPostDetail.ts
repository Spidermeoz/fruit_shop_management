import type { PostRepository } from "../../../domain/posts/PostRepository";

export class GetPostDetail {
  constructor(private repo: PostRepository) {}

  async execute(id: number) {
    const post = await this.repo.findById(id);

    if (!post) {
      throw new Error("Post not found");
    }

    return post.props;
  }
}
