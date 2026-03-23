export type ProductTagGroup =
  | "general"
  | "taste"
  | "benefit"
  | "season"
  | "usage";

export type ProductTag = {
  id?: number;
  name: string;
  slug?: string | null;
  tagGroup: ProductTagGroup;
  description?: string | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProductTagListFilter = {
  page?: number;
  limit?: number;
  q?: string;
  tagGroup?: ProductTagGroup | "all";
  sortBy?: "id" | "name" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
};

export type CreateProductTagInput = {
  name: string;
  slug?: string | null;
  tagGroup: ProductTagGroup;
  description?: string | null;
};

export type UpdateProductTagPatch = Partial<CreateProductTagInput> & {
  deleted?: boolean;
};

export interface ProductTagRepository {
  list(
    filter: ProductTagListFilter,
  ): Promise<{ rows: ProductTag[]; count: number }>;
  findById(id: number): Promise<ProductTag | null>;
  create(input: CreateProductTagInput): Promise<ProductTag>;
  update(id: number, patch: UpdateProductTagPatch): Promise<ProductTag>;
  softDelete(id: number): Promise<void>;
  bulkSoftDelete(ids: number[]): Promise<number>;
}
