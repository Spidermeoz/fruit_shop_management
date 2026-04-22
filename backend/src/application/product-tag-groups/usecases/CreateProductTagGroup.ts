import type {
  CreateProductTagGroupInput,
  ProductTagGroupRepository,
} from "../../../domain/products/ProductTagGroupRepository";
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

const toSnapshot = (value: any) => value ?? null;

export class CreateProductTagGroup {
  constructor(
    private repo: ProductTagGroupRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreateProductTagGroupInput, actor?: ActorContext) {
    const name = input.name?.trim();

    if (!name) {
      throw new Error("Name is required");
    }

    const created = await this.repo.create({
      name,
      slug: input.slug?.trim() || null,
    });

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
        action: "create",
        moduleName: "product_tag_group",
        entityType: "product_tag_group",
        entityId: Number(created.id ?? 0) || null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: toSnapshot(created),
      });
    }

    return { id: created.id! };
  }
}
