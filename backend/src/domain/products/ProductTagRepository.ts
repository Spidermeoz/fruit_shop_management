export type ProductTagGroup = "season" | "health" | "usage" | "audience";
export type ProductTagStatus = "active" | "inactive";

export type ProductTag = {
  id?: number;
  name: string;
  slug?: string | null;
  tagGroup: ProductTagGroup;
  description?: string | null;
  status: ProductTagStatus;
  position?: number | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProductTagListFilter = {
  page?: number;
  limit?: number;
  q?: string;
  status?: ProductTagStatus | "all";
  tagGroup?: ProductTagGroup | "all";
  sortBy?: "id" | "name" | "position" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
};

export type CreateProductTagInput = {
  name: string;
  slug?: string | null;
  tagGroup: ProductTagGroup;
  description?: string | null;
  status?: ProductTagStatus;
  position?: number | null;
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
  changeStatus(id: number, status: ProductTagStatus): Promise<void>;
}
