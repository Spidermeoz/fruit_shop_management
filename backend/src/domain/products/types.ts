// src/domain/products/types.ts

export type ProductStatus = "active" | "inactive";
export type ProductVariantStatus = "active" | "inactive";

export type Pagination = {
  page?: number;
  limit?: number;
};

export type Sort = {
  sortBy?: "id" | "title" | "price" | "stock" | "position" | "createdAt";
  order?: "ASC" | "DESC";
};

export type ProductListFilter = Pagination &
  Sort & {
    q?: string;
    categoryId?: number | number[] | null;
    status?: ProductStatus | "all";
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
  };

export type ProductOptionValueInput = {
  id?: number;
  value: string;
  position?: number;
};

export type ProductOptionInput = {
  id?: number;
  name: string;
  position?: number;
  values: ProductOptionValueInput[];
};

export type ProductVariantSelectedOptionValueInput = {
  id?: number;
  value: string;
  optionId?: number;
  optionName?: string;
  position?: number;
};

export type ProductVariantInput = {
  id?: number;
  sku?: string | null;
  title?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  status?: ProductVariantStatus;
  sortOrder?: number;
  optionValueIds?: number[];
  optionValues?: ProductVariantSelectedOptionValueInput[];
};

export type ProductPriceRange = {
  minPrice: number | null;
  maxPrice: number | null;
};

export type ProductTagGroup = "season" | "health" | "usage" | "audience";

export type OriginRef = {
  id: number;
  name: string;
  slug: string;
};

export type ProductTagGroups = {
  season: ProductTagRef[];
  health: ProductTagRef[];
  usage: ProductTagRef[];
  audience: ProductTagRef[];
};

export type ProductTagRef = {
  id: number;
  name: string;
  slug: string;
  tagGroup: ProductTagGroup;
};
