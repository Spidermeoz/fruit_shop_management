export type OriginStatus = "active" | "inactive";

export type Origin = {
  id?: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  countryCode?: string | null;
  status: OriginStatus;
  position?: number | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type OriginListFilter = {
  page?: number;
  limit?: number;
  q?: string;
  status?: OriginStatus | "all";
  sortBy?: "id" | "name" | "position" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
};

export type CreateOriginInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
  countryCode?: string | null;
  status?: OriginStatus;
  position?: number | null;
};

export type UpdateOriginPatch = Partial<CreateOriginInput> & {
  deleted?: boolean;
};

export interface OriginRepository {
  list(filter: OriginListFilter): Promise<{ rows: Origin[]; count: number }>;
  findById(id: number): Promise<Origin | null>;
  create(input: CreateOriginInput): Promise<Origin>;
  update(id: number, patch: UpdateOriginPatch): Promise<Origin>;
  changeStatus(id: number, status: OriginStatus): Promise<void>;
}
