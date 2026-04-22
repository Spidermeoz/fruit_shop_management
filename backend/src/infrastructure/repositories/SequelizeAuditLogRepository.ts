import { Op, type Transaction } from "sequelize";
import type { AuditLogRepository } from "../../domain/audit-logs/AuditLogRepository";
import type {
  AuditLogListFilter,
  AuditLogListItem,
  AuditLogListResult,
  AuditLogRecord,
  CreateAuditLogInput,
} from "../../domain/audit-logs/types";

type AuditLogModels = {
  AuditLog: any;
  User?: any;
  Role?: any;
  Branch?: any;
};

const toAuditLogRecord = (row: any): AuditLogRecord => ({
  id: Number(row.id),
  actorUserId:
    row.actor_user_id !== null && row.actor_user_id !== undefined
      ? Number(row.actor_user_id)
      : null,
  actorRoleId:
    row.actor_role_id !== null && row.actor_role_id !== undefined
      ? Number(row.actor_role_id)
      : null,
  branchId:
    row.branch_id !== null && row.branch_id !== undefined
      ? Number(row.branch_id)
      : null,
  action: row.action,
  moduleName: row.module_name,
  entityType: row.entity_type ?? null,
  entityId:
    row.entity_id !== null && row.entity_id !== undefined
      ? Number(row.entity_id)
      : null,
  requestId: row.request_id ?? null,
  httpMethod: row.http_method ?? null,
  routePath: row.route_path ?? null,
  ipAddress: row.ip_address ?? null,
  userAgent: row.user_agent ?? null,
  oldValuesJson: row.old_values_json ?? null,
  newValuesJson: row.new_values_json ?? null,
  metaJson: row.meta_json ?? null,
  createdAt: row.created_at,
});

export class SequelizeAuditLogRepository implements AuditLogRepository {
  constructor(private readonly models: AuditLogModels) {}

  async create(
    input: CreateAuditLogInput,
    transaction?: Transaction,
  ): Promise<AuditLogRecord> {
    const created = await this.models.AuditLog.create(
      {
        actor_user_id: input.actorUserId ?? null,
        actor_role_id: input.actorRoleId ?? null,
        branch_id: input.branchId ?? null,
        action: input.action,
        module_name: input.moduleName,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        request_id: input.requestId ?? null,
        http_method: input.httpMethod ?? null,
        route_path: input.routePath ?? null,
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent ?? null,
        old_values_json: input.oldValuesJson ?? null,
        new_values_json: input.newValuesJson ?? null,
        meta_json: input.metaJson ?? null,
      },
      { transaction },
    );

    return toAuditLogRecord(created);
  }

  async list(filter: AuditLogListFilter): Promise<AuditLogListResult> {
    const page = Math.max(1, Number(filter.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(filter.limit ?? 20)));
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filter.actorUserId) {
      where.actor_user_id = Number(filter.actorUserId);
    }

    if (filter.actorRoleId) {
      where.actor_role_id = Number(filter.actorRoleId);
    }

    if (filter.branchId) {
      where.branch_id = Number(filter.branchId);
    }

    if (filter.moduleName) {
      where.module_name = String(filter.moduleName).trim().toLowerCase();
    }

    if (filter.action) {
      where.action = String(filter.action).trim().toLowerCase();
    }

    if (filter.requestId) {
      where.request_id = String(filter.requestId).trim();
    }

    const q = String(filter.q ?? "").trim();
    if (q) {
      where[Op.or] = [
        { action: { [Op.like]: `%${q}%` } },
        { module_name: { [Op.like]: `%${q}%` } },
        { entity_type: { [Op.like]: `%${q}%` } },
        { route_path: { [Op.like]: `%${q}%` } },
        { ip_address: { [Op.like]: `%${q}%` } },
      ];
    }

    const createdAtWhere: any = {};
    if (filter.dateFrom) {
      createdAtWhere[Op.gte] = new Date(`${filter.dateFrom}T00:00:00`);
    }

    if (filter.dateTo) {
      createdAtWhere[Op.lte] = new Date(`${filter.dateTo}T23:59:59.999`);
    }

    if (Object.keys(createdAtWhere).length > 0) {
      where.created_at = createdAtWhere;
    }

    const result = await this.models.AuditLog.findAndCountAll({
      where,
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset,
    });

    const rows = result.rows ?? [];
    const actorIds = Array.from(
      new Set(
        rows
          .map((row: any) => Number(row.actor_user_id))
          .filter((value: number) => Number.isFinite(value) && value > 0),
      ),
    );
    const roleIds = Array.from(
      new Set(
        rows
          .map((row: any) => Number(row.actor_role_id))
          .filter((value: number) => Number.isFinite(value) && value > 0),
      ),
    );
    const branchIds = Array.from(
      new Set(
        rows
          .map((row: any) => Number(row.branch_id))
          .filter((value: number) => Number.isFinite(value) && value > 0),
      ),
    );

    const actorMap = new Map<number, any>();
    if (actorIds.length > 0 && this.models.User) {
      const actors = await this.models.User.findAll({
        where: { id: { [Op.in]: actorIds } },
        attributes: ["id", "full_name", "email", "avatar"],
      });

      for (const actor of actors) {
        actorMap.set(Number(actor.id), actor);
      }
    }

    const roleMap = new Map<number, any>();
    if (roleIds.length > 0 && this.models.Role) {
      const roles = await this.models.Role.findAll({
        where: { id: { [Op.in]: roleIds } },
        attributes: ["id", "title", "code"],
      });

      for (const role of roles) {
        roleMap.set(Number(role.id), role);
      }
    }

    const branchMap = new Map<number, any>();
    if (branchIds.length > 0 && this.models.Branch) {
      const branches = await this.models.Branch.findAll({
        where: { id: { [Op.in]: branchIds } },
        attributes: ["id", "name", "code"],
      });

      for (const branch of branches) {
        branchMap.set(Number(branch.id), branch);
      }
    }

    return {
      rows: rows.map((row: any) => {
        const actor = actorMap.get(Number(row.actor_user_id));
        const role = roleMap.get(Number(row.actor_role_id));
        const branch = branchMap.get(Number(row.branch_id));

        return {
          ...toAuditLogRecord(row),
          actorName: actor?.full_name ?? null,
          actorEmail: actor?.email ?? null,
          actorAvatar: actor?.avatar ?? null,
          roleTitle: role?.title ?? null,
          roleCode: role?.code ?? null,
          branchName: branch?.name ?? null,
          branchCode: branch?.code ?? null,
        } as AuditLogListItem;
      }),
      count: Number(result.count || 0),
      page,
      limit,
    };
  }
}
