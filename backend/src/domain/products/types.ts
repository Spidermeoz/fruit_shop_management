// src/domain/products/types.ts

// Trạng thái sản phẩm 
export type ProductStatus = 'active' | 'inactive';

// Tham số phân trang & lọc dùng chung cho repository
export type Pagination = { page?: number; limit?: number };
export type Sort = { sortBy?: 'id'|'title'|'price'|'stock'|'position'|'createdAt'; order?: 'ASC'|'DESC' };

export type ProductListFilter = Pagination & Sort & {
  q?: string;                  // tìm theo title/slug
  categoryId?: number | null;  // lọc theo danh mục
  status?: ProductStatus | 'all';
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
};