import type {
  Origin,
  OriginStatus,
} from "../../domain/products/OriginRepository";

export type OriginDTO = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  countryCode: string | null;
  status: OriginStatus;
  position: number | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export const toDTO = (o: Origin): OriginDTO => ({
  id: o.id!,
  name: o.name,
  slug: o.slug ?? null,
  description: o.description ?? null,
  countryCode: o.countryCode ?? null,
  status: o.status,
  position: o.position ?? null,
  deleted: !!o.deleted,
  deletedAt: o.deletedAt ?? null,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});
