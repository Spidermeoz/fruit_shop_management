import type {
  CreateProductTagInput,
  ProductTagRepository,
} from "../../../domain/products/ProductTagRepository";
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

export class CreateProductTag {
  constructor(
    private repo: ProductTagRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreateProductTagInput, actor?: ActorContext) {
    const name = input.name?.trim();

    if (!name) {
      throw new Error("Name is required");
    }

    if (
      input.productTagGroupId === undefined ||
      input.productTagGroupId === null ||
      !Number.isInteger(Number(input.productTagGroupId)) ||
      Number(input.productTagGroupId) <= 0
    ) {
      throw new Error("Product tag group is required");
    }

    const created = await this.repo.create({
      name,
      slug: input.slug?.trim() || null,
      productTagGroupId: Number(input.productTagGroupId),
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
        moduleName: "product_tag",
        entityType: "product_tag",
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
