import type { ProductTag } from "../../domain/products/ProductTagRepository";

export type ProductTagDTO = {
  id: number;
  name: string;
  slug: string | null;
  productTagGroupId: number;
  group: {
    id: number;
    name: string;
    slug: string | null;
  } | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export const toDTO = (t: ProductTag): ProductTagDTO => ({
  id: t.id!,
  name: t.name,
  slug: t.slug ?? null,
  productTagGroupId: t.productTagGroupId,
  group: t.group
    ? {
        id: t.group.id!,
        name: t.group.name,
        slug: t.group.slug ?? null,
      }
    : null,
  deleted: !!t.deleted,
  deletedAt: t.deletedAt ?? null,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});
