// src/domain/categories/ProductCategoryRepository.ts
import { ProductCategory } from "./ProductCategory";
import type { CategoryListFilter, CategoryStatus } from "./types";

export type CreateCategoryInput = {
  title: string;
  parentId?: number | null;
  description?: string | null;
  thumbnail?: string | null;
  status?: CategoryStatus;     // default 'active'
  position?: number | null;    // nếu null → auto theo sibling
  slug?: string | null;        // infra sẽ ensure unique theo title nếu thiếu
};

export type UpdateCategoryPatch = Partial<Omit<CreateCategoryInput, "title">> & {
  title?: string;              // cho phép đổi title
  deleted?: boolean;           // toggle soft-delete
};

export interface ProductCategoryRepository {
  list(filter: CategoryListFilter): Promise<{ rows: ProductCategory[]; count: number }>;
  findById(id: number): Promise<ProductCategory | null>;
  findByIdWithParent?(id: number): Promise<{ category: ProductCategory; parent: ProductCategory | null } | null>;

  create(input: CreateCategoryInput): Promise<ProductCategory>;

  /**
   * Update 1 danh mục. Nếu parentId thay đổi hoặc position null,
   * infra có thể tự tính position mới dựa trên sibling cùng parent.
   */
  update(id: number, patch: UpdateCategoryPatch): Promise<ProductCategory>;

  changeStatus(id: number, status: CategoryStatus): Promise<void>;

  /**
   * Soft-delete một danh mục. Yêu cầu hạ tầng detach con: parent_id = null cho children.
   */
  softDelete(id: number): Promise<void>;

  /**
   * Bulk patch cho nhiều id (status/flags...). Trả về số bản ghi ảnh hưởng.
   */
  bulkEdit(ids: number[], patch: UpdateCategoryPatch): Promise<number>;

  /**
   * Đổi thứ tự nhiều danh mục cùng lúc.
   * Ví dụ: [{id: 10, position: 1}, {id: 12, position: 2}]
   */
  reorderPositions(pairs: { id: number; position: number }[]): Promise<number>;

  /**
   * Đặt parent_id = null cho children của các id (dùng khi xóa mềm danh mục cha).
   */
  detachChildrenOf(parentIds: number[]): Promise<number>;
}
