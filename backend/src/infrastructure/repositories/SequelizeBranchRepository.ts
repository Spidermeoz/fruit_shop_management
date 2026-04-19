import { Op, WhereOptions, OrderItem } from "sequelize";
import { Branch } from "../../domain/branches/Branch";
import type { BranchRepository } from "../../domain/branches/BranchRepository";
import type {
  CreateBranchInput,
  ListBranchesFilter,
  UpdateBranchPatch,
} from "../../domain/branches/types";

type Models = { Branch: any };

const toBool = (v: any) => v === true || v === 1 || v === "1";

const mapSort = (sort?: any): OrderItem[] => {
  if (!sort) return [["id", "ASC"]];
  const colMap: Record<string, string> = {
    id: "id",
    name: "name",
    code: "code",
    status: "status",
    created_at: "created_at",
    updated_at: "updated_at",
  };
  const col = colMap[sort.column] ?? "id";
  const dir = sort.dir === "ASC" ? "ASC" : "DESC";
  return [[col, dir]];
};

export class SequelizeBranchRepository implements BranchRepository {
  constructor(private models: Models) {}

  private mapRow = (r: any): Branch =>
    Branch.create({
      id: Number(r.id),
      name: r.name,
      code: r.code,
      phone: r.phone ?? null,
      email: r.email ?? null,
      addressLine1: r.address_line1 ?? null,
      addressLine2: r.address_line2 ?? null,
      ward: r.ward ?? null,
      district: r.district ?? null,
      province: r.province ?? null,
      latitude: r.latitude != null ? Number(r.latitude) : null,
      longitude: r.longitude != null ? Number(r.longitude) : null,
      openTime: r.open_time ?? null,
      closeTime: r.close_time ?? null,
      supportsPickup: toBool(r.supports_pickup),
      supportsDelivery: toBool(r.supports_delivery),
      status: r.status,
      deleted: toBool(r.deleted),
      deletedAt: r.deleted_at ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });

  async list(filter: ListBranchesFilter) {
    const where: WhereOptions = {};
    if (!filter?.includeDeleted) (where as any).deleted = 0;
    if (filter?.status && filter.status !== "all") {
      (where as any).status = filter.status;
    }
    if (filter?.q?.trim()) {
      const q = filter.q.trim();
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { code: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows, count } = await this.models.Branch.findAndCountAll({
      where,
      order: mapSort(filter?.sort),
      limit: filter?.limit ?? 10,
      offset: filter?.offset ?? 0,
    });

    return { rows: rows.map(this.mapRow), count };
  }

  async findById(id: number, includeDeleted = false) {
    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;
    const row = await this.models.Branch.findOne({ where });
    return row ? this.mapRow(row) : null;
  }

  async findByCode(code: string) {
    const row = await this.models.Branch.findOne({
      where: { code: code.trim().toUpperCase(), deleted: 0 },
    });
    return row ? this.mapRow(row) : null;
  }

  async create(input: CreateBranchInput) {
    const row = await this.models.Branch.create({
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      phone: input.phone ?? null,
      email: input.email?.trim().toLowerCase() ?? null,
      address_line1: input.addressLine1 ?? null,
      address_line2: input.addressLine2 ?? null,
      ward: input.ward ?? null,
      district: input.district ?? null,
      province: input.province ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      open_time: input.openTime ?? null,
      close_time: input.closeTime ?? null,
      supports_pickup: input.supportsPickup ?? true,
      supports_delivery: input.supportsDelivery ?? true,
      status: input.status ?? "active",
      deleted: 0,
      deleted_at: null,
    });

    const found = await this.models.Branch.findByPk(row.id);
    if (!found) throw new Error("Branch not found after create");
    return this.mapRow(found);
  }

  async update(id: number, patch: UpdateBranchPatch) {
    const values: any = {};
    if (patch.name !== undefined) values.name = patch.name.trim();
    if (patch.code !== undefined) values.code = patch.code.trim().toUpperCase();
    if (patch.phone !== undefined) values.phone = patch.phone ?? null;
    if (patch.email !== undefined)
      values.email = patch.email?.trim().toLowerCase() ?? null;
    if (patch.addressLine1 !== undefined)
      values.address_line1 = patch.addressLine1 ?? null;
    if (patch.addressLine2 !== undefined)
      values.address_line2 = patch.addressLine2 ?? null;
    if (patch.ward !== undefined) values.ward = patch.ward ?? null;
    if (patch.district !== undefined) values.district = patch.district ?? null;
    if (patch.province !== undefined) values.province = patch.province ?? null;
    if (patch.latitude !== undefined) values.latitude = patch.latitude ?? null;
    if (patch.longitude !== undefined)
      values.longitude = patch.longitude ?? null;
    if (patch.openTime !== undefined) values.open_time = patch.openTime ?? null;
    if (patch.closeTime !== undefined)
      values.close_time = patch.closeTime ?? null;
    if (patch.supportsPickup !== undefined)
      values.supports_pickup = patch.supportsPickup;
    if (patch.supportsDelivery !== undefined)
      values.supports_delivery = patch.supportsDelivery;
    if (patch.status !== undefined) values.status = patch.status;

    await this.models.Branch.update(values, { where: { id } });

    const found = await this.models.Branch.findByPk(id);
    if (!found) throw new Error("Branch not found after update");
    return this.mapRow(found);
  }

  async updateStatus(id: number, status: "active" | "inactive") {
    await this.models.Branch.update({ status }, { where: { id } });
    const found = await this.models.Branch.findByPk(id);
    if (!found) throw new Error("Branch not found after updateStatus");
    return this.mapRow(found);
  }

  async softDelete(id: number) {
    const now = new Date();
    await this.models.Branch.update(
      { deleted: 1, deleted_at: now },
      { where: { id } },
    );
    return { id, deletedAt: now };
  }
}
