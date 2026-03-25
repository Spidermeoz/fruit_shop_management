import type { ProductTagGroup } from "../../domain/products/ProductTagGroupRepository";

export type ProductTagGroupDTO = {
  id: number;
  name: string;
  slug: string | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: Array<{
    id: number;
    name: string;
    slug: string | null;
    productTagGroupId: number;
    deleted: boolean;
    deletedAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
};

export const toDTO = (g: ProductTagGroup): ProductTagGroupDTO => ({
  id: g.id!,
  name: g.name,
  slug: g.slug ?? null,
  deleted: !!g.deleted,
  deletedAt: g.deletedAt ?? null,
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
  tags: g.tags?.map((tag) => ({
    id: tag.id!,
    name: tag.name,
    slug: tag.slug ?? null,
    productTagGroupId: tag.productTagGroupId,
    deleted: !!tag.deleted,
    deletedAt: tag.deletedAt ?? null,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  })),
});
