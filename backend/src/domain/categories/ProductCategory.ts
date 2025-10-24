// src/domain/categories/ProductCategory.ts
import type { CategoryStatus } from "./types";

export interface ProductCategoryProps {
  id?: number;
  title: string;
  parentId?: number | null;
  description?: string | null;
  thumbnail?: string | null;
  status: CategoryStatus;
  position?: number | null;
  slug?: string | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductCategory {
  private _props: ProductCategoryProps;

  private constructor(props: ProductCategoryProps) {
    this._props = ProductCategory.validate(props);
  }

  static create(props: ProductCategoryProps) {
    return new ProductCategory(props);
  }

  get props(): Readonly<ProductCategoryProps> {
    return this._props;
  }

  static validate(p: ProductCategoryProps): ProductCategoryProps {
    if (!p.title || !p.title.toString().trim()) {
      throw new Error("Category.title is required");
    }
    // position có thể null (auto-calc theo sibling), nếu có thì >= 1
    if (p.position != null && p.position < 1) {
      throw new Error("Category.position must be >= 1");
    }
    return {
      ...p,
      title: p.title.toString().trim(),
      parentId: p.parentId ?? null,
      description: p.description ?? null,
      thumbnail: p.thumbnail ?? null,
      position: p.position ?? null,
      slug: p.slug ?? null,
      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,
    };
  }

  changeStatus(next: CategoryStatus) {
    this._props = ProductCategory.validate({ ...this._props, status: next });
  }

  softDelete() {
    this._props = ProductCategory.validate({ ...this._props, deleted: true, deletedAt: new Date() });
  }
}
