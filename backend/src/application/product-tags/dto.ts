import type {
  ProductTag,
  ProductTagGroup,
  ProductTagStatus,
} from "../../domain/products/ProductTagRepository";

export type ProductTagDTO = {
  id: number;
  name: string;
  slug: string | null;
  tagGroup: ProductTagGroup;
  description: string | null;
  status: ProductTagStatus;
  position: number | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export const toDTO = (t: ProductTag): ProductTagDTO => ({
  id: t.id!,
  name: t.name,
  slug: t.slug ?? null,
  tagGroup: t.tagGroup,
  description: t.description ?? null,
  status: t.status,
  position: t.position ?? null,
  deleted: !!t.deleted,
  deletedAt: t.deletedAt ?? null,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});
