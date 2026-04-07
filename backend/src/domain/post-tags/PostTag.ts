import type { PostTagStatus } from "./types";

export interface PostTagProps {
  id?: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  status: PostTagStatus;
  position?: number | null;

  deleted?: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export class PostTag {
  private _props: PostTagProps;

  private constructor(props: PostTagProps) {
    this._props = PostTag.validate(props);
  }

  static create(props: PostTagProps) {
    return new PostTag(props);
  }

  get props(): Readonly<PostTagProps> {
    return this._props;
  }

  get id() {
    return this._props.id;
  }

  get name() {
    return this._props.name;
  }

  get slug() {
    return this._props.slug;
  }

  get status() {
    return this._props.status;
  }

  static validate(p: PostTagProps): PostTagProps {
    if (!p.name || !String(p.name).trim()) {
      throw new Error("PostTag.name is required");
    }

    if (
      p.position !== undefined &&
      p.position !== null &&
      !Number.isFinite(Number(p.position))
    ) {
      throw new Error("PostTag.position must be a valid number");
    }

    return {
      ...p,
      name: String(p.name).trim(),
      slug: p.slug ? String(p.slug).trim() : null,
      description: p.description != null ? String(p.description).trim() : null,
      status: p.status ?? "active",
      position:
        p.position !== undefined && p.position !== null
          ? Number(p.position)
          : 0,
      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,
    };
  }
}
