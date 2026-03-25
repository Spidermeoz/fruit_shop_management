export type ProductTagGroupEntity = {
  id?: number;
  name: string;
  slug?: string | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProductTag = {
  id?: number;
  name: string;
  slug?: string | null;
  productTagGroupId: number;
  group?: ProductTagGroupEntity | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProductTagListFilter = {
  page?: number;
  limit?: number;
  q?: string;
  productTagGroupId?: number | "all";
  sortBy?: "id" | "name" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
};

export type CreateProductTagInput = {
  name: string;
  slug?: string | null;
  productTagGroupId: number;
};

export type UpdateProductTagPatch = Partial<CreateProductTagInput> & {
  deleted?: boolean;
};

export interface ProductTagRepository {
  list(
    filter: ProductTagListFilter,
  ): Promise<{ rows: ProductTag[]; count: number }>;

  findById(id: number): Promise<ProductTag | null>;

  findActiveByIds(ids: number[]): Promise<ProductTag[]>;

  create(input: CreateProductTagInput): Promise<ProductTag>;

  update(id: number, patch: UpdateProductTagPatch): Promise<ProductTag>;

  softDelete(id: number): Promise<void>;

  bulkSoftDelete(ids: number[]): Promise<number>;
}
