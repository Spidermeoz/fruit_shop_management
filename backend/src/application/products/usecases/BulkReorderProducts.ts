import type { ProductRepository } from '../../../domain/products/ProductRepository';
import type { CreateAuditLog } from '../../audit-logs/usecases/CreateAuditLog';

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

export class BulkReorderProducts {
  constructor(
    private repo: ProductRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    positions: Array<{ id: number; position: number }>,
    updatedById?: number,
    actor?: ActorContext,
  ) {
    if (!Array.isArray(positions) || positions.length === 0) {
      throw new Error('positions must be a non-empty array');
    }
    const allValid = positions.every(p =>
      Number.isFinite(p.id) && Number.isFinite(p.position)
    );
    if (!allValid) throw new Error('positions contains invalid id/position');

    const ids = positions.map((item) => Number(item.id));
    const before = await Promise.all(
      ids.map(async (id) =>
        typeof (this.repo as any).findById === 'function'
          ? await (this.repo as any).findById(id)
          : null,
      ),
    );

    const affected = await this.repo.reorderPositions(positions, updatedById);

    const after = await Promise.all(
      ids.map(async (id) =>
        typeof (this.repo as any).findById === 'function'
          ? await (this.repo as any).findById(id)
          : null,
      ),
    );

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : updatedById !== undefined && updatedById !== null
              ? Number(updatedById)
              : null,
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: 'bulk_reorder',
        moduleName: 'product',
        entityType: 'product',
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before.map((item) => item?.props ?? null),
        newValuesJson: after.map((item) => item?.props ?? null),
        metaJson: { positions, affected },
      });
    }

    return { affected };
  }
}
