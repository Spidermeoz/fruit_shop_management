// src/domain/products/ProductRepository.ts
import { Product } from './Products';
import type { ProductListFilter, ProductStatus } from './types';

export type CreateProductInput = {
  categoryId?: number | null;
  title: string;
  description?: string | null;
  price?: number | null;
  discountPercentage?: number | null;
  stock?: number;
  thumbnail?: string | null;
  slug?: string | null;          // có thể để infra tự sinh
  status?: ProductStatus;        // default 'active'
  featured?: boolean;
  position?: number | null;
  createdById?: number | null;
};

export type UpdateProductPatch = Partial<Omit<CreateProductInput, 'slug'>> & {
  // cho phép chỉnh slug nếu bạn muốn, hoặc để infra kiểm soát
  slug?: string | null;
  deleted?: boolean;             // soft-delete toggle
  updatedById?: number | null;
  deletedById?: number | null;
};

export interface ProductRepository {
  list(filter: ProductListFilter): Promise<{ rows: Product[]; count: number }>;
  findById(id: number): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: number, patch: UpdateProductPatch): Promise<Product>;
  changeStatus(id: number, status: ProductStatus): Promise<void>;
  softDelete(id: number): Promise<void>;
  bulkEdit(ids: number[], patch: UpdateProductPatch): Promise<number>; // trả về số bản ghi ảnh hưởng
  reorderPositions(pairs: { id: number; position: number }[], updatedById?: number): Promise<number>;
}
