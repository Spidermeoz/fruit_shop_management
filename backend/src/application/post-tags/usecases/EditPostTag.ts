import { PostTag } from "../../../domain/post-tags/PostTag";
import type {
  PostTagRepository,
  UpdatePostTagPatch,
} from "../../../domain/post-tags/PostTagRepository";

function normalizeNullableText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export class EditPostTag {
  constructor(private repo: PostTagRepository) {}

  async execute(id: number, patch: UpdatePostTagPatch) {
    const existingTag = await this.repo.findById(id);

    if (!existingTag) {
      throw new Error("Post tag not found");
    }

    const normalizedPatch: UpdatePostTagPatch = {
      ...(patch.name !== undefined ? { name: String(patch.name).trim() } : {}),
      ...(patch.description !== undefined
        ? { description: normalizeNullableText(patch.description) }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.deleted !== undefined ? { deleted: !!patch.deleted } : {}),
    };

    const updatedTag = PostTag.create({
      ...existingTag.props,
      ...normalizedPatch,
      name:
        normalizedPatch.name !== undefined
          ? normalizedPatch.name
          : existingTag.props.name,
    });

    const updatePayload: UpdatePostTagPatch = {
      name: updatedTag.props.name,
      description: updatedTag.props.description ?? null,
      status: updatedTag.props.status,
      ...(normalizedPatch.deleted !== undefined
        ? { deleted: normalizedPatch.deleted }
        : {}),
    };

    return this.repo.update(id, updatePayload);
  }
}
