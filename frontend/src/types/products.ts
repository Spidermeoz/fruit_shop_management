export interface ProductCategoryLite {
  id?: number;
  title: string;
}

export interface ProductOptionValue {
  id: number;
  value: string;
  position?: number;
}

export interface ProductOption {
  id: number;
  name: string;
  position?: number;
  values: ProductOptionValue[];
}

export interface ProductVariantOptionValue {
  id: number;
  value: string;
  optionId?: number;
  optionName?: string;
  position?: number;
}

export interface ProductVariant {
  id: number;
  productId?: number | null;
  sku?: string | null;
  title?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  status: string;
  sortOrder?: number;
  optionValueIds?: number[];
  optionValues?: ProductVariantOptionValue[];
}

export interface ProductPriceRange {
  min: number;
  max: number;
}

export interface Product {
  id: number;
  title: string;
  slug?: string | null;

  description?: string | null;
  image?: string | null;
  thumbnail?: string | null;

  status: string;
  featured: boolean;
  position?: number | null;

  category_id?: number | null;
  product_category_id?: number | null;
  category_title?: string | null;
  category?: ProductCategoryLite | null;

  price: number;
  effective_price?: number;
  discount_percentage?: number | null;
  discountPercentage?: number | null;

  stock: number;
  totalStock?: number;

  variants?: ProductVariant[];
  options?: ProductOption[];
  defaultVariantId?: number | null;
  priceRange?: ProductPriceRange | null;

  average_rating?: number;
  review_count?: number;

  created_at?: string | number | Date;
  updated_at?: string | number | Date;
  updatedAt?: string;
}

export interface ProductSummary {
  total: number;
  outOfStock: number;
  lowStock: number;
  totalInventoryValue: number;
}
