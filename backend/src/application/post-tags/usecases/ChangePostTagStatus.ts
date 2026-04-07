import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";
import type { PostTagStatus } from "../../../domain/post-tags/types";

export class ChangePostTagStatus {
  constructor(private repo: PostTagRepository) {}

  async execute(id: number, status: PostTagStatus) {
    await this.repo.changeStatus(id, status);
    return { id, status };
  }
}
