export type ProductTagGroup = {
  id?: number;
  name: string;
  slug?: string | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: Array<{
    id?: number;
    name: string;
    slug?: string | null;
    productTagGroupId: number;
    deleted?: boolean;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
};

export type ProductTagGroupListFilter = {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "id" | "name" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
  includeTags?: boolean;
};

export type CreateProductTagGroupInput = {
  name: string;
  slug?: string | null;
};

export type UpdateProductTagGroupPatch = Partial<CreateProductTagGroupInput> & {
  deleted?: boolean;
};

export interface ProductTagGroupRepository {
  list(
    filter: ProductTagGroupListFilter,
  ): Promise<{ rows: ProductTagGroup[]; count: number }>;

  findById(
    id: number,
    options?: { includeTags?: boolean },
  ): Promise<ProductTagGroup | null>;

  create(input: CreateProductTagGroupInput): Promise<ProductTagGroup>;

  update(
    id: number,
    patch: UpdateProductTagGroupPatch,
  ): Promise<ProductTagGroup>;

  softDelete(id: number): Promise<void>;
}
