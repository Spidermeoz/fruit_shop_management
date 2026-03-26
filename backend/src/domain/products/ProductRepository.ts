// src/domain/products/ProductRepository.ts
import { Product } from "./Products";
import type {
  ProductListFilter,
  ProductOptionInput,
  ProductStatus,
  ProductVariantInput,
} from "./types";

export type CreateProductInput = {
  categoryId?: number | null;
  title: string;
  description?: string | null;
  price?: number | null;
  stock?: number;
  thumbnail?: string | null;
  slug?: string | null;
  status?: ProductStatus;
  featured?: boolean;
  position?: number | null;
  createdById?: number | null;
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

export interface ProductVariantStockInfo {
  id: number;
  productId: number;
  title?: string | null;
  sku?: string | null;
  price: number;
  stock: number; // compatibility / mirror
  availableStock?: number;
  reservedQuantity?: number;
  status: string;
}

export interface ProductRepository {
  list(filter: ProductListFilter): Promise<{ rows: Product[]; count: number }>;
  findById(id: number): Promise<Product | null>;
  findVariantById(
    variantId: number,
    transaction?: any,
  ): Promise<ProductVariantStockInfo | null>;
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
