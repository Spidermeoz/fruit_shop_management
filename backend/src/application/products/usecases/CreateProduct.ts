import { BranchRepository } from "../../../domain/branches/BranchRepository";
import type {
  CreateProductInput,
  ProductRepository,
} from "../../../domain/products/ProductRepository";
import type { ProductTagRepository } from "../../../domain/products/ProductTagRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

function normalizeTagIds(tagIds?: number[]) {
  if (!Array.isArray(tagIds)) return [];

  return [...new Set(tagIds.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
}

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

const toProductSnapshot = (product: any) => ({
  id: product?.props?.id ?? null,
  categoryId: product?.props?.categoryId ?? null,
  originId: product?.props?.originId ?? null,
  title: product?.props?.title ?? null,
  slug: product?.props?.slug ?? null,
  status: product?.props?.status ?? null,
  featured: !!product?.props?.featured,
  price: product?.props?.price ?? null,
  thumbnail: product?.props?.thumbnail ?? null,
  tagIds: product?.props?.tagIds ?? [],
  options: product?.props?.options ?? [],
  variants: product?.props?.variants ?? [],
});

export class CreateProduct {
  constructor(
    private repo: ProductRepository,
    private inventoryRepo: any,
    private productTagRepo: ProductTagRepository,
    private branchRepo: BranchRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreateProductInput, actor?: ActorContext) {
    if (!input.title?.trim()) {
      throw new Error("Title is required");
    }

    const normalizedTagIds = normalizeTagIds(input.tagIds);

    if (normalizedTagIds.length > 0) {
      const validTags =
        await this.productTagRepo.findActiveByIds(normalizedTagIds);

      if (validTags.length !== normalizedTagIds.length) {
        throw new Error(
          "Một hoặc nhiều tag không hợp lệ, đã bị xóa hoặc không còn hoạt động",
        );
      }
    }

    const normalizedOptions = Array.isArray(input.options)
      ? input.options.map((option, optionIndex) => ({
          id: option.id,
          name: String(option.name ?? "").trim(),
          position: option.position ?? optionIndex,
          values: Array.isArray(option.values)
            ? option.values.map((value, valueIndex) => ({
                id: value.id,
                value: String(value.value ?? "").trim(),
                position: value.position ?? valueIndex,
              }))
            : [],
        }))
      : [];

    const normalizedVariants = Array.isArray(input.variants)
      ? input.variants.map((variant, index) => ({
          id: variant.id,
          sku: variant.sku ?? null,
          title: variant.title ?? null,
          price: Number(variant.price ?? 0),
          compareAtPrice:
            variant.compareAtPrice !== undefined &&
            variant.compareAtPrice !== null
              ? Number(variant.compareAtPrice)
              : null,
          status: variant.status ?? "active",
          sortOrder: variant.sortOrder ?? index,
          optionValueIds: Array.isArray(variant.optionValueIds)
            ? [...new Set(variant.optionValueIds.map(Number))].filter(
                (id) => Number.isInteger(id) && id > 0,
              )
            : [],
          optionValues: Array.isArray(variant.optionValues)
            ? variant.optionValues.map((ov) => ({
                id: ov.id,
                value: String(ov.value ?? "").trim(),
                optionId:
                  ov.optionId !== undefined && ov.optionId !== null
                    ? Number(ov.optionId)
                    : undefined,
                optionName: String(ov.optionName ?? "").trim(),
                position:
                  ov.position !== undefined && ov.position !== null
                    ? Number(ov.position)
                    : undefined,
              }))
            : [],
        }))
      : [];

    const created = await this.repo.create({
      ...input,
      title: input.title.trim(),
      tagIds: normalizedTagIds,
      options: normalizedOptions,
      variants: normalizedVariants,
      status: input.status ?? "active",
      featured: !!input.featured,
    });

    const fresh = await this.repo.findById(Number(created.props.id));

    const { rows: activeBranches } = await this.branchRepo.list({
      status: "active",
      includeDeleted: false,
      limit: 1000,
      offset: 0,
    });
    const variants = fresh?.props.variants ?? [];

    for (const branch of activeBranches) {
      for (const variant of variants) {
        if (!variant.id) continue;
        await this.inventoryRepo.ensureStock(
          Number(branch.props.id),
          Number(variant.id),
          0,
        );
      }
    }

    const auditProduct = fresh ?? created;
    const auditProps = auditProduct?.props;

    if (!auditProps) {
      throw new Error("Product not found after create");
    }

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
        moduleName: "product",
        entityType: "product",
        entityId: Number(created.props.id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: {
          id: Number(created.props.id),
          title: String((fresh ?? created).props.title ?? ""),
          slug: String((fresh ?? created).props.slug ?? ""),
          status: String((fresh ?? created).props.status ?? ""),
          featured: Boolean((fresh ?? created).props.featured),
          variantCount: Array.isArray(auditProps?.variants)
            ? auditProps.variants.length
            : 0,
          tagCount: Array.isArray(auditProps?.tags)
            ? auditProps.tags.length
            : 0,
        },
        metaJson: {
          categoryId: Number((fresh ?? created).props.categoryId ?? 0) || null,
          originId: Number((fresh ?? created).props.originId ?? 0) || null,
        },
      });
    }

    return { id: created.props.id! };
  }
}
