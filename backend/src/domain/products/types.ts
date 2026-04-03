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

export type ProductStockStatus =
  | "all"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

export type ProductListFilter = Pagination &
  Sort & {
    q?: string;
    categoryId?: number | number[] | null;
    status?: ProductStatus | "all";
    featured?: boolean;

    minPrice?: number;
    maxPrice?: number;

    minStock?: number;
    maxStock?: number;
    stockStatus?: ProductStockStatus;

    missingThumbnail?: boolean;
    hasPendingReviews?: boolean;

    lowStockThreshold?: number;
  };

export type ProductListSummary = {
  totalItems: number;
  activeCount: number;
  inactiveCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  missingThumbnailCount: number;
  pendingReviewCount: number;
  productsWithPendingReviewCount: number;
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
  status?: ProductVariantStatus;
  sortOrder?: number;
  optionValueIds?: number[];
  optionValues?: ProductVariantSelectedOptionValueInput[];
};

export type ProductPriceRange = {
  minPrice: number | null;
  maxPrice: number | null;
};

export type OriginRef = {
  id: number;
  name: string;
  slug: string;
};

export type ProductTagGroupRef = {
  id: number;
  name: string;
  slug: string | null;
};

export type ProductTagRef = {
  id: number;
  name: string;
  slug: string;
  productTagGroupId?: number | null;
  group?: ProductTagGroupRef | null;
};
