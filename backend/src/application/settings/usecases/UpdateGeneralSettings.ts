// src/application/settings/usecases/UpdateGeneralSettings.ts

import type {
  SettingGeneralRepository,
  UpdateSettingGeneralInput,
} from "../../../domain/settings/SettingGeneralRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

type ActorContext = {
  id?: number | null;
  roleId?: number | null;
  branchIds?: number[];
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const pickActorBranchId = (actor?: ActorContext): number | null => {
  if (!Array.isArray(actor?.branchIds)) return null;
  const branchId = actor.branchIds
    .map(Number)
    .find((x) => Number.isFinite(x) && x > 0);
  return branchId ?? null;
};
const toSnapshot = (value: any) => value?.props ?? value ?? null;

export class UpdateGeneralSettings {
  constructor(
    private repo: SettingGeneralRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(patch: UpdateSettingGeneralInput, actor?: ActorContext) {
    const before = await this.repo.get();
    const updated = await this.repo.update(patch);

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : null,
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "update",
        moduleName: "setting_general",
        entityType: "setting_general",
        entityId: Number(updated?.props?.id ?? before?.props?.id ?? 1),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(before) as any,
        newValuesJson: toSnapshot(updated) as any,
        metaJson: { changedFields: Object.keys(patch ?? {}) },
      });
    }

    return {
      id: updated.props.id,
      website_name: updated.props.websiteName ?? null,
      logo: updated.props.logo ?? null,
      phone: updated.props.phone ?? null,
      email: updated.props.email ?? null,
      facebook: updated.props.facebook ?? null,
      zalo: updated.props.zalo ?? null,
      address: updated.props.address ?? null,
      copyright: updated.props.copyright ?? null,
      created_at: updated.props.createdAt ?? null,
      updated_at: updated.props.updatedAt ?? null,
    };
  }
}
