import type {
  CreatePostTagInput,
  PostTagRepository,
} from "../../../domain/post-tags/PostTagRepository";

function normalizeNullableText(value?: string | null) {
  if (value === undefined || value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export class CreatePostTag {
  constructor(private repo: PostTagRepository) {}

  async execute(input: CreatePostTagInput) {
    if (!input.name?.trim()) {
      throw new Error("Name is required");
    }

    const created = await this.repo.create({
      name: input.name.trim(),
      description: normalizeNullableText(input.description),
      status: input.status ?? "active",
    });

    return { id: created.props.id! };
  }
}
