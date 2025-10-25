// src/domain/products/Product.ts
import type { ProductStatus } from "./types";

export interface ProductProps {
  id?: number;

  // mapping cột DB: product_category_id
  categoryId?: number | null;

  title: string;
  description?: string | null;

  // DECIMAL(12,2) trong DB → number trong domain
  price?: number | null;

  // 0..100
  discountPercentage?: number | null;

  // UNSIGNED, default 0
  stock: number;

  // TEXT / URL
  thumbnail?: string | null;

  // STRING(255)
  slug?: string | null;

  status: ProductStatus;

  // TINYINT → boolean
  featured?: boolean;

  // vị trí sort tuỳ chọn
  position?: number | null;

  // aggregate từ reviews
  averageRating?: number; // 0..5
  reviewCount?: number; // >=0

  // soft-delete
  deleted?: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;

  createdById?: number | null;
  updatedById?: number | null;

  category?: { id: number; title: string } | null;
}

export class Product {
  private _props: ProductProps;

  private constructor(props: ProductProps) {
    this._props = Product.validate(props);
  }

  // Factory
  static create(props: ProductProps) {
    return new Product(props);
  }

  // Đọc props an toàn (không cho sửa trực tiếp)
  get props(): Readonly<ProductProps> {
    return this._props;
  }

  // Một số bất biến nhẹ nhàng ở domain
  static validate(p: ProductProps): ProductProps {
    if (!p.title || !p.title.toString().trim()) {
      throw new Error("Product.title is required");
    }
    if (p.stock != null && p.stock < 0) {
      throw new Error("Product.stock must be >= 0");
    }
    if (p.price != null && p.price < 0) {
      throw new Error("Product.price must be >= 0");
    }
    if (p.discountPercentage != null) {
      if (p.discountPercentage < 0 || p.discountPercentage > 100) {
        throw new Error("Product.discountPercentage must be between 0 and 100");
      }
    }
    if (
      p.averageRating != null &&
      (p.averageRating < 0 || p.averageRating > 5)
    ) {
      throw new Error("Product.averageRating must be between 0 and 5");
    }
    if (p.reviewCount != null && p.reviewCount < 0) {
      throw new Error("Product.reviewCount must be >= 0");
    }
    const normalized: ProductProps = {
      ...p, // spread trước
      featured: p.featured ?? false,
      stock: p.stock ?? 0,
      reviewCount: p.reviewCount ?? 0,
      averageRating: p.averageRating ?? 0,
      deleted: p.deleted ?? false,
    };
    return normalized;
  }

  // Một số hành vi nhỏ (tuỳ dùng)
  changeStatus(next: ProductStatus) {
    this._props = Product.validate({ ...this._props, status: next });
  }

  applyDiscount(percent: number | null) {
    const discountPercentage = percent ?? null;
    this._props = Product.validate({ ...this._props, discountPercentage });
  }
}
