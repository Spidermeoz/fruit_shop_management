import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";

export class GetPostTagDetail {
  constructor(private repo: PostTagRepository) {}

  async execute(id: number) {
    const tag = await this.repo.findById(id);

    if (!tag) {
      throw new Error("Post tag not found");
    }

    return tag.props;
  }
}
