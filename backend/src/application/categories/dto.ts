// src/application/categories/dto.ts
import type { ProductCategory } from "../../domain/categories/ProductCategory";
import type { CategoryStatus } from "../../domain/categories/types";

export type CategoryDTO = {
  id: number;
  title: string;
  parentId: number | null;
  description: string | null;
  thumbnail: string | null;
  status: CategoryStatus;
  position: number | null;
  slug: string | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export const toDTO = (c: ProductCategory): CategoryDTO => ({
  id: c.props.id!,
  title: c.props.title,
  parentId: c.props.parentId ?? null,
  description: c.props.description ?? null,
  thumbnail: c.props.thumbnail ?? null,
  status: c.props.status,
  position: c.props.position ?? null,
  slug: c.props.slug ?? null,
  deleted: !!c.props.deleted,
  deletedAt: c.props.deletedAt ?? null,
  createdAt: c.props.createdAt,
  updatedAt: c.props.updatedAt,
});
