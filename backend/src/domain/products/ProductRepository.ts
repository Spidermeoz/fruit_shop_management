import { Product } from "./Products";
import type {
  ProductListFilter,
  ProductOptionInput,
  ProductStatus,
  ProductVariantInput,
  ProductListSummary,
} from "./types";

export interface ProductListResult {
  rows: Product[];
  count: number;
  summary: ProductListSummary;
}

export type CreateProductInput = {
  categoryId?: number | null;
  title: string;
  description?: string | null;

  // Transitional / compatibility fields
  price?: number | null;

  thumbnail?: string | null;
  slug?: string | null;
  status?: ProductStatus;
  featured?: boolean;
  position?: number | null;

  createdById?: number | null;
  updatedById?: number | null;
  deletedById?: number | null;

  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];

  originId?: number | null;
  shortDescription?: string | null;
  storageGuide?: string | null;
  usageSuggestions?: string | null;
  nutritionNotes?: string | null;
  tagIds?: number[];
};

export type UpdateProductPatch = Partial<
  Omit<CreateProductInput, "slug" | "options" | "variants">
> & {
  slug?: string | null;
  deleted?: boolean;
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
};

export interface ProductVariantStockInfo {
  id: number;
  productId: number;
  title?: string | null;
  sku?: string | null;
  price: number;
  stock: number; // mirror compatibility field
  availableStock?: number;
  reservedQuantity?: number;
  status: string;
}

export interface ProductRepository {
  list(filter: ProductListFilter): Promise<ProductListResult>;

  findById(id: number): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;

  create(input: CreateProductInput): Promise<Product>;
  update(id: number, patch: UpdateProductPatch): Promise<Product>;

  changeStatus(id: number, status: ProductStatus): Promise<void>;
  softDelete(id: number): Promise<void>;
  bulkEdit(ids: number[], patch: UpdateProductPatch): Promise<number>;
  reorderPositions(
    pairs: { id: number; position: number }[],
    updatedById?: number,
  ): Promise<number>;

  findVariantById(
    variantId: number,
    transaction?: any,
  ): Promise<ProductVariantStockInfo | null>;

  // Mirror fields for backward compatibility only
  updateVariantMirrorStock(
    variantId: number,
    stock: number,
    transaction?: any,
  ): Promise<void>;

  updateProductMirrorStock(
    productId: number,
    stock: number,
    transaction?: any,
  ): Promise<void>;

  // Legacy stock methods kept for compatibility
  decreaseVariantStock(
    variantId: number,
    quantity: number,
    transaction?: any,
  ): Promise<void>;

  increaseVariantStock(
    variantId: number,
    quantity: number,
    transaction?: any,
  ): Promise<void>;
}
