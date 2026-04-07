import type {
  BulkEditPostTagsInput,
  PostTagRepository,
} from "../../../domain/post-tags/PostTagRepository";

export class BulkEditPostTags {
  constructor(private repo: PostTagRepository) {}

  async execute(input: BulkEditPostTagsInput) {
    const ids = Array.from(
      new Set(
        (input.ids || []).map((id) => Number(id)).filter(Number.isFinite),
      ),
    );

    if (!ids.length) {
      throw new Error("No post tag ids provided");
    }

    const patch = input.patch || {};

    if (!Object.keys(patch).length) {
      throw new Error("No bulk edit patch provided");
    }

    const affected = await this.repo.bulkEdit({
      ids,
      patch,
    });

    return {
      affected,
      ids,
    };
  }
}
