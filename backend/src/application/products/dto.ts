// src/application/products/dto.ts
import type { ProductStatus } from "../../domain/products/types";
import type { Product } from "../../domain/products/Products";

export type ProductDTO = {
  product_category_id: number | null;
  id: number;
  categoryId: number | null;
  title: string;
  description: string | null;
  price: number | null;
  discountPercentage: number | null;
  stock: number;
  thumbnail: string | null;
  slug: string | null;
  status: ProductStatus;
  featured: boolean;
  position: number | null;
  averageRating: number;
  reviewCount: number;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number | null;
  updatedById?: number | null;
  // field suy diễn cho FE (tuỳ dùng)
  effectivePrice: number | null; // price sau khi áp discount
  category: { id: number; title: string } | null;
};

export const toDTO = (p: Product): ProductDTO => {
  const price = p.props.price ?? null;
  const discount = p.props.discountPercentage ?? 0;
  const effectivePrice =
    price === null
      ? null
      : Math.round((price * (100 - discount)) as number) / 100;

  return {
    product_category_id: p.props.categoryId ?? null,
    id: p.props.id!,
    categoryId: p.props.categoryId ?? null,
    title: p.props.title,
    description: p.props.description ?? null,
    price,
    discountPercentage: p.props.discountPercentage ?? null,
    stock: p.props.stock ?? 0,
    thumbnail: p.props.thumbnail ?? null,
    slug: p.props.slug ?? null,
    status: p.props.status,
    featured: !!p.props.featured,
    position: p.props.position ?? null,
    averageRating: p.props.averageRating ?? 0,
    reviewCount: p.props.reviewCount ?? 0,
    deleted: !!p.props.deleted,
    deletedAt: p.props.deletedAt ?? null,
    createdAt: p.props.createdAt,
    updatedAt: p.props.updatedAt,
    createdById: p.props.createdById ?? null,
    updatedById: p.props.updatedById ?? null,
    effectivePrice,
    category: p.props.category ?? null,
  };
};
