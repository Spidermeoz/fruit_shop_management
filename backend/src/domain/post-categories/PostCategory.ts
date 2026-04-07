import type {
  PostCategoryRef,
  PostCategorySeoInput,
  PostCategoryStatus,
  PostCategoryTreeNode,
} from "./types";

export interface PostCategoryProps extends PostCategorySeoInput {
  id?: number;
  title: string;
  parentId?: number | null;

  description?: string | null;
  thumbnail?: string | null;

  status: PostCategoryStatus;
  position?: number | null;
  slug?: string | null;

  deleted?: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;

  parent?: PostCategoryRef | null;
  children?: PostCategoryTreeNode[];
}

export class PostCategory {
  private _props: PostCategoryProps;

  private constructor(props: PostCategoryProps) {
    this._props = PostCategory.validate(props);
  }

  static create(props: PostCategoryProps) {
    return new PostCategory(props);
  }

  get props(): Readonly<PostCategoryProps> {
    return this._props;
  }

  get id() {
    return this._props.id;
  }

  get title() {
    return this._props.title;
  }

  get slug() {
    return this._props.slug;
  }

  get parentId() {
    return this._props.parentId;
  }

  get status() {
    return this._props.status;
  }

  get children() {
    return this._props.children ?? [];
  }

  static validate(p: PostCategoryProps): PostCategoryProps {
    if (!p.title || !String(p.title).trim()) {
      throw new Error("PostCategory.title is required");
    }

    if (
      p.position !== undefined &&
      p.position !== null &&
      !Number.isFinite(Number(p.position))
    ) {
      throw new Error("PostCategory.position must be a valid number");
    }

    if (p.status !== "active" && p.status !== "inactive") {
      throw new Error("PostCategory.status is invalid");
    }

    const normalizedChildren = Array.isArray(p.children)
      ? p.children
          .map((child, index) => ({
            id: Number(child.id),
            title: String(child.title ?? "").trim(),
            slug: child.slug ?? null,
            status: child.status ?? "active",
            position:
              child.position !== undefined && child.position !== null
                ? Number(child.position)
                : index,
            parentId:
              child.parentId !== undefined && child.parentId !== null
                ? Number(child.parentId)
                : null,
            children: Array.isArray(child.children) ? child.children : [],
          }))
          .filter(
            (child) =>
              Number.isInteger(child.id) && child.id > 0 && !!child.title,
          )
      : [];

    const normalizedParent =
      p.parent && p.parent.id
        ? {
            id: Number(p.parent.id),
            title: String(p.parent.title ?? "").trim(),
            slug: p.parent.slug ?? null,
          }
        : null;

    const normalized: PostCategoryProps = {
      ...p,
      title: String(p.title).trim(),
      parentId:
        p.parentId !== undefined && p.parentId !== null
          ? Number(p.parentId)
          : null,

      description: p.description != null ? String(p.description).trim() : null,
      thumbnail: p.thumbnail ?? null,

      status: p.status ?? "active",
      position:
        p.position !== undefined && p.position !== null
          ? Number(p.position)
          : null,
      slug: p.slug ? String(p.slug).trim() : null,

      seoTitle: p.seoTitle != null ? String(p.seoTitle).trim() : null,
      seoDescription:
        p.seoDescription != null ? String(p.seoDescription).trim() : null,
      seoKeywords: p.seoKeywords != null ? String(p.seoKeywords).trim() : null,
      ogImage: p.ogImage ?? null,
      canonicalUrl:
        p.canonicalUrl != null ? String(p.canonicalUrl).trim() : null,

      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,

      parent: normalizedParent,
      children: normalizedChildren,
    };

    if (
      normalized.id !== undefined &&
      normalized.parentId !== null &&
      normalized.parentId !== undefined &&
      Number(normalized.id) === Number(normalized.parentId)
    ) {
      throw new Error("PostCategory cannot be its own parent");
    }

    return normalized;
  }
}
