// src/application/products/dto.ts
import type { Product } from "../../domain/products/Products";
import type {
  ProductPriceRange,
  ProductStatus,
  ProductVariantStatus,
} from "../../domain/products/types";

export type ProductOptionValueDTO = {
  id?: number;
  value: string;
  position?: number;
};

export type ProductOptionDTO = {
  id?: number;
  name: string;
  position?: number;
  values: ProductOptionValueDTO[];
};

export type ProductVariantOptionValueDTO = {
  id: number;
  value: string;
  optionId?: number;
  optionName?: string;
  position?: number;
};

export type ProductVariantDTO = {
  id?: number;
  productId?: number;
  sku?: string | null;
  title?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number; // mirror / compatibility
  availableStock?: number;
  reservedQuantity?: number;
  status: ProductVariantStatus;
  sortOrder?: number;
  optionValueIds: number[];
  optionValues: ProductVariantOptionValueDTO[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProductDTO = {
  product_category_id: number | null;
  id: number;
  categoryId: number | null;
  title: string;
  description: string | null;

  // product-level summary / fallback fields
  price: number | null;
  stock: number;
  totalStock: number;
  defaultVariantId: number | null;
  priceRange: ProductPriceRange | null;

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

  category: { id: number; title: string } | null;
  originId?: number | null;
  origin: { id: number; name: string; slug: string } | null;

  shortDescription: string | null;
  storageGuide: string | null;
  usageSuggestions: string | null;
  nutritionNotes: string | null;

  tags: {
    id: number;
    name: string;
    slug: string;
    productTagGroupId?: number | null;
    group?: {
      id: number;
      name: string;
      slug: string | null;
    } | null;
  }[];

  tagIds?: number[];

  variants: ProductVariantDTO[];
  options: ProductOptionDTO[];
};

export const toDTO = (p: Product): ProductDTO => {
  const price = p.props.price ?? null;

  return {
    product_category_id: p.props.categoryId ?? null,
    id: p.props.id!,
    categoryId: p.props.categoryId ?? null,
    title: p.props.title,
    description: p.props.description ?? null,

    // summary / fallback product-level fields
    price,
    stock: p.props.stock ?? 0,
    totalStock: p.props.totalStock ?? p.props.stock ?? 0,
    defaultVariantId: p.props.defaultVariantId ?? null,
    priceRange: p.props.priceRange ?? null,

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

    category: p.props.category ?? null,
    originId: p.props.originId ?? null,
    origin: p.props.origin ?? null,

    shortDescription: p.props.shortDescription ?? null,
    storageGuide: p.props.storageGuide ?? null,
    usageSuggestions: p.props.usageSuggestions ?? null,
    nutritionNotes: p.props.nutritionNotes ?? null,

    tags: (p.props.tags ?? []).map((tag) => ({
      id: Number(tag.id),
      name: String(tag.name ?? ""),
      slug: String(tag.slug ?? ""),
      productTagGroupId:
        (tag as any).productTagGroupId !== undefined
          ? Number((tag as any).productTagGroupId)
          : null,
      group: (tag as any).group
        ? {
            id: Number((tag as any).group.id),
            name: String((tag as any).group.name ?? ""),
            slug: (tag as any).group.slug ?? null,
          }
        : null,
    })),
    tagIds: p.props.tags?.map((t) => t.id) ?? [],

    variants: (p.props.variants ?? []).map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku ?? null,
      title: variant.title ?? null,
      price: Number(variant.price ?? 0),
      compareAtPrice:
        variant.compareAtPrice !== undefined ? variant.compareAtPrice : null,
      stock: Number(variant.stock ?? 0),
      availableStock:
        (variant as any).availableStock !== undefined
          ? Number((variant as any).availableStock ?? 0)
          : undefined,
      reservedQuantity:
        (variant as any).reservedQuantity !== undefined
          ? Number((variant as any).reservedQuantity ?? 0)
          : undefined,
      status: variant.status ?? "active",
      sortOrder: variant.sortOrder ?? 0,
      optionValueIds: variant.optionValueIds ?? [],
      optionValues: (variant.optionValues ?? []).map((ov) => ({
        id: Number(ov.id),
        value: ov.value,
        optionId: ov.optionId,
        optionName: ov.optionName,
        position: ov.position,
      })),
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    })),

    options: (p.props.options ?? []).map((option) => ({
      id: option.id,
      name: option.name,
      position: option.position ?? 0,
      values: (option.values ?? []).map((value) => ({
        id: value.id,
        value: value.value,
        position: value.position ?? 0,
      })),
    })),
  };
};
