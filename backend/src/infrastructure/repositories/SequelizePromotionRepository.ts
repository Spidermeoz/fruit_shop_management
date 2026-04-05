import { Op } from "sequelize";
import type { PromotionRepository } from "../../domain/promotions/PromotionRepository";
import type {
  CreatePromotionInput,
  PromotionCodeProps,
  PromotionListFilter,
  PromotionListResult,
  PromotionProps,
  PromotionUsageProps,
  UpdatePromotionPatch,
} from "../../domain/promotions/types";

type PromotionUsageListFilter = {
  promotionId?: number | null;
  userId?: number | null;
  orderId?: number | null;
  page?: number;
  limit?: number;
};

type Models = {
  Promotion: any;
  PromotionCode: any;
  PromotionUsage: any;
  PromotionProduct: any;
  PromotionCategory: any;
  PromotionVariant: any;
  PromotionOrigin: any;
  PromotionBranch: any;
};

const toPlain = (row: any) =>
  row && typeof row.get === "function" ? row.get({ plain: true }) : row;

const normalizeCode = (value?: string | null): string =>
  String(value ?? "")
    .trim()
    .toUpperCase();

export class SequelizePromotionRepository implements PromotionRepository {
  constructor(private readonly models: Models) {}

  private mapPromotionCodeRow(row: any): PromotionCodeProps {
    const r = toPlain(row);

    return {
      id: Number(r.id),
      promotionId: Number(r.promotion_id),
      code: String(r.code ?? "")
        .trim()
        .toUpperCase(),
      status: r.status,
      deleted: !!r.deleted,
      usageLimit:
        r.usage_limit !== null && r.usage_limit !== undefined
          ? Number(r.usage_limit)
          : null,
      usageCount: Number(r.usage_count ?? 0),
      startAt: r.start_at ? new Date(r.start_at) : null,
      endAt: r.end_at ? new Date(r.end_at) : null,
      createdAt: r.created_at ? new Date(r.created_at) : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
    };
  }

  private async loadTargets(
    promotionId: number,
    transaction?: any,
  ): Promise<PromotionProps["targets"]> {
    const [productRows, categoryRows, variantRows, originRows, branchRows] =
      await Promise.all([
        this.models.PromotionProduct.findAll({
          where: { promotion_id: promotionId },
          attributes: ["product_id"],
          raw: true,
          transaction,
        }),
        this.models.PromotionCategory.findAll({
          where: { promotion_id: promotionId },
          attributes: ["product_category_id"],
          raw: true,
          transaction,
        }),
        this.models.PromotionVariant.findAll({
          where: { promotion_id: promotionId },
          attributes: ["product_variant_id"],
          raw: true,
          transaction,
        }),
        this.models.PromotionOrigin.findAll({
          where: { promotion_id: promotionId },
          attributes: ["origin_id"],
          raw: true,
          transaction,
        }),
        this.models.PromotionBranch.findAll({
          where: { promotion_id: promotionId },
          attributes: ["branch_id"],
          raw: true,
          transaction,
        }),
      ]);

    return {
      productIds: productRows.map((x: any) => Number(x.product_id)),
      categoryIds: categoryRows.map((x: any) => Number(x.product_category_id)),
      variantIds: variantRows.map((x: any) => Number(x.product_variant_id)),
      originIds: originRows.map((x: any) => Number(x.origin_id)),
      branchIds: branchRows.map((x: any) => Number(x.branch_id)),
    };
  }

  private async mapPromotionRow(
    row: any,
    transaction?: any,
  ): Promise<PromotionProps> {
    const r = toPlain(row);
    const promotionId = Number(r.id);

    const codeRows = Array.isArray(r.codes)
      ? r.codes
      : await this.models.PromotionCode.findAll({
          where: { promotion_id: promotionId },
          order: [
            ["created_at", "ASC"],
            ["id", "ASC"],
          ],
          transaction,
        });

    const targets =
      r.targets ?? (await this.loadTargets(promotionId, transaction));

    return {
      id: promotionId,
      name: r.name,
      description: r.description ?? null,
      promotionScope: r.promotion_scope,
      discountType: r.discount_type,
      discountValue: Number(r.discount_value ?? 0),
      maxDiscountAmount:
        r.max_discount_amount !== null && r.max_discount_amount !== undefined
          ? Number(r.max_discount_amount)
          : null,
      minOrderValue:
        r.min_order_value !== null && r.min_order_value !== undefined
          ? Number(r.min_order_value)
          : null,
      isAutoApply: !!r.is_auto_apply,
      canCombine: !!r.can_combine,
      priority: Number(r.priority ?? 0),
      usageLimit:
        r.usage_limit !== null && r.usage_limit !== undefined
          ? Number(r.usage_limit)
          : null,
      usageLimitPerUser:
        r.usage_limit_per_user !== null && r.usage_limit_per_user !== undefined
          ? Number(r.usage_limit_per_user)
          : null,
      startAt: r.start_at ? new Date(r.start_at) : null,
      endAt: r.end_at ? new Date(r.end_at) : null,
      status: r.status,
      deleted: !!r.deleted,
      deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
      createdAt: r.created_at ? new Date(r.created_at) : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
      codes: codeRows.map((code: any) => this.mapPromotionCodeRow(code)),
      targets,
    };
  }

  private async syncTargets(
    promotionId: number,
    data: {
      productIds?: number[];
      categoryIds?: number[];
      variantIds?: number[];
      originIds?: number[];
      branchIds?: number[];
    },
    transaction?: any,
  ) {
    if (data.productIds !== undefined) {
      await this.models.PromotionProduct.destroy({
        where: { promotion_id: promotionId },
        transaction,
      });

      if (data.productIds.length) {
        await this.models.PromotionProduct.bulkCreate(
          data.productIds.map((productId) => ({
            promotion_id: promotionId,
            product_id: productId,
          })),
          { transaction },
        );
      }
    }

    if (data.categoryIds !== undefined) {
      await this.models.PromotionCategory.destroy({
        where: { promotion_id: promotionId },
        transaction,
      });

      if (data.categoryIds.length) {
        await this.models.PromotionCategory.bulkCreate(
          data.categoryIds.map((productCategoryId) => ({
            promotion_id: promotionId,
            product_category_id: productCategoryId,
          })),
          { transaction },
        );
      }
    }

    if (data.variantIds !== undefined) {
      await this.models.PromotionVariant.destroy({
        where: { promotion_id: promotionId },
        transaction,
      });

      if (data.variantIds.length) {
        await this.models.PromotionVariant.bulkCreate(
          data.variantIds.map((productVariantId) => ({
            promotion_id: promotionId,
            product_variant_id: productVariantId,
          })),
          { transaction },
        );
      }
    }

    if (data.originIds !== undefined) {
      await this.models.PromotionOrigin.destroy({
        where: { promotion_id: promotionId },
        transaction,
      });

      if (data.originIds.length) {
        await this.models.PromotionOrigin.bulkCreate(
          data.originIds.map((originId) => ({
            promotion_id: promotionId,
            origin_id: originId,
          })),
          { transaction },
        );
      }
    }

    if (data.branchIds !== undefined) {
      await this.models.PromotionBranch.destroy({
        where: { promotion_id: promotionId },
        transaction,
      });

      if (data.branchIds.length) {
        await this.models.PromotionBranch.bulkCreate(
          data.branchIds.map((branchId) => ({
            promotion_id: promotionId,
            branch_id: branchId,
          })),
          { transaction },
        );
      }
    }
  }

  private async syncCodes(
    promotionId: number,
    codes:
      | Array<{
          code: string;
          status?: "active" | "inactive";
          usageLimit?: number | null;
          startAt?: Date | null;
          endAt?: Date | null;
        }>
      | undefined,
    transaction?: any,
  ) {
    if (codes === undefined) return;

    await this.models.PromotionCode.destroy({
      where: { promotion_id: promotionId },
      transaction,
    });

    if (!codes.length) return;

    await this.models.PromotionCode.bulkCreate(
      codes.map((item) => ({
        promotion_id: promotionId,
        code: normalizeCode(item.code),
        status: item.status ?? "active",
        deleted: 0,
        deleted_at: null,
        usage_limit: item.usageLimit !== undefined ? item.usageLimit : null,
        usage_count: 0,
        start_at: item.startAt ?? null,
        end_at: item.endAt ?? null,
      })),
      { transaction },
    );
  }

  async list(filter: PromotionListFilter): Promise<PromotionListResult> {
    const page = Math.max(1, Number(filter.page ?? 1));
    const limit = Math.max(1, Number(filter.limit ?? 10));
    const offset = (page - 1) * limit;

    const where: any = {};

    if (!filter.includeDeleted) {
      where.deleted = 0;
    }

    if (filter.status && filter.status !== "all") {
      where.status = filter.status;
    }

    if (filter.promotionScope && filter.promotionScope !== "all") {
      where.promotion_scope = filter.promotionScope;
    }

    if (filter.isAutoApply !== null && filter.isAutoApply !== undefined) {
      where.is_auto_apply = filter.isAutoApply ? 1 : 0;
    }

    if (filter.q && String(filter.q).trim()) {
      const q = String(filter.q).trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows, count } = await this.models.Promotion.findAndCountAll({
      where,
      order: [
        ["priority", "DESC"],
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset,
    });

    const mappedRows = await Promise.all(
      rows.map((row: any) => this.mapPromotionRow(row)),
    );

    return { rows: mappedRows, count };
  }

  async findById(id: number): Promise<PromotionProps | null> {
    const row = await this.models.Promotion.findByPk(id);

    if (!row) return null;

    return this.mapPromotionRow(row);
  }

  async create(input: CreatePromotionInput): Promise<PromotionProps> {
    const transaction = await this.models.Promotion.sequelize.transaction();

    try {
      const created = await this.models.Promotion.create(
        {
          name: input.name,
          description: input.description ?? null,
          promotion_scope: input.promotionScope,
          discount_type: input.discountType,
          discount_value: Number(input.discountValue ?? 0),
          max_discount_amount:
            input.maxDiscountAmount !== undefined
              ? input.maxDiscountAmount
              : null,
          min_order_value:
            input.minOrderValue !== undefined ? input.minOrderValue : null,
          is_auto_apply: input.isAutoApply ? 1 : 0,
          can_combine: input.canCombine ? 1 : 0,
          priority: Number(input.priority ?? 0),
          usage_limit: input.usageLimit !== undefined ? input.usageLimit : null,
          usage_limit_per_user:
            input.usageLimitPerUser !== undefined
              ? input.usageLimitPerUser
              : null,
          start_at: input.startAt ?? null,
          end_at: input.endAt ?? null,
          status: input.status ?? "active",
          deleted: 0,
          deleted_at: null,
        },
        { transaction },
      );

      const promotionId = Number(created.id);

      await this.syncCodes(promotionId, input.codes, transaction);
      await this.syncTargets(
        promotionId,
        {
          productIds: input.productIds ?? [],
          categoryIds: input.categoryIds ?? [],
          variantIds: input.variantIds ?? [],
          originIds: input.originIds ?? [],
          branchIds: input.branchIds ?? [],
        },
        transaction,
      );

      await transaction.commit();

      const fresh = await this.findById(promotionId);
      if (!fresh) {
        throw new Error("Không thể tải lại khuyến mãi sau khi tạo");
      }

      return fresh;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(
    id: number,
    patch: UpdatePromotionPatch,
  ): Promise<PromotionProps> {
    const existing = await this.findById(id);

    if (!existing) {
      throw new Error("Khuyến mãi không tồn tại");
    }

    const transaction = await this.models.Promotion.sequelize.transaction();

    try {
      const updateData: any = {};

      if (patch.name !== undefined) updateData.name = patch.name;
      if (patch.description !== undefined) {
        updateData.description = patch.description ?? null;
      }
      if (patch.promotionScope !== undefined) {
        updateData.promotion_scope = patch.promotionScope;
      }
      if (patch.discountType !== undefined) {
        updateData.discount_type = patch.discountType;
      }
      if (patch.discountValue !== undefined) {
        updateData.discount_value = Number(patch.discountValue ?? 0);
      }
      if (patch.maxDiscountAmount !== undefined) {
        updateData.max_discount_amount = patch.maxDiscountAmount ?? null;
      }
      if (patch.minOrderValue !== undefined) {
        updateData.min_order_value = patch.minOrderValue ?? null;
      }
      if (patch.isAutoApply !== undefined) {
        updateData.is_auto_apply = patch.isAutoApply ? 1 : 0;
      }
      if (patch.canCombine !== undefined) {
        updateData.can_combine = patch.canCombine ? 1 : 0;
      }
      if (patch.priority !== undefined) {
        updateData.priority = Number(patch.priority ?? 0);
      }
      if (patch.usageLimit !== undefined) {
        updateData.usage_limit = patch.usageLimit ?? null;
      }
      if (patch.usageLimitPerUser !== undefined) {
        updateData.usage_limit_per_user = patch.usageLimitPerUser ?? null;
      }
      if (patch.startAt !== undefined) {
        updateData.start_at = patch.startAt ?? null;
      }
      if (patch.endAt !== undefined) {
        updateData.end_at = patch.endAt ?? null;
      }
      if (patch.status !== undefined) {
        updateData.status = patch.status;
      }
      if (patch.deleted !== undefined) {
        updateData.deleted = patch.deleted ? 1 : 0;
        updateData.deleted_at = patch.deleted ? new Date() : null;
      }

      if (Object.keys(updateData).length > 0) {
        await this.models.Promotion.update(updateData, {
          where: { id },
          transaction,
        });
      }

      await this.syncCodes(id, patch.codes, transaction);
      await this.syncTargets(
        id,
        {
          productIds: patch.productIds,
          categoryIds: patch.categoryIds,
          variantIds: patch.variantIds,
          originIds: patch.originIds,
          branchIds: patch.branchIds,
        },
        transaction,
      );

      await transaction.commit();

      const fresh = await this.findById(id);
      if (!fresh) {
        throw new Error("Không thể tải lại khuyến mãi sau khi cập nhật");
      }

      return fresh;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async changeStatus(id: number, status: "active" | "inactive"): Promise<void> {
    await this.models.Promotion.update(
      { status },
      {
        where: { id },
      },
    );
  }

  async softDelete(id: number): Promise<void> {
    await this.models.Promotion.update(
      {
        deleted: 1,
        deleted_at: new Date(),
        status: "inactive",
      },
      {
        where: { id },
      },
    );
  }

  async findPromotionCodeByCode(
    code: string,
  ): Promise<PromotionCodeProps | null> {
    const normalizedCode = normalizeCode(code);

    const row = await this.models.PromotionCode.findOne({
      where: {
        code: normalizedCode,
      },
    });

    if (!row) return null;

    return this.mapPromotionCodeRow(row);
  }

  async findPromotionByCode(code: string): Promise<PromotionProps | null> {
    const promotionCode = await this.findPromotionCodeByCode(code);

    if (!promotionCode) return null;

    return this.findById(promotionCode.promotionId);
  }

  async findActiveAutoApplyPromotions(now: Date): Promise<PromotionProps[]> {
    const rows = await this.models.Promotion.findAll({
      where: {
        status: "active",
        deleted: 0,
        is_auto_apply: 1,
        [Op.and]: [
          {
            [Op.or]: [{ start_at: null }, { start_at: { [Op.lte]: now } }],
          },
          {
            [Op.or]: [{ end_at: null }, { end_at: { [Op.gte]: now } }],
          },
        ],
      },
      order: [
        ["priority", "DESC"],
        ["id", "DESC"],
      ],
    });

    return Promise.all(rows.map((row: any) => this.mapPromotionRow(row)));
  }

  async countUsageByPromotion(
    promotionId: number,
    transaction?: any,
  ): Promise<number> {
    return this.models.PromotionUsage.count({
      where: { promotion_id: promotionId },
      transaction,
    });
  }

  async countUsageByPromotionAndUser(
    promotionId: number,
    userId: number,
    transaction?: any,
  ): Promise<number> {
    return this.models.PromotionUsage.count({
      where: {
        promotion_id: promotionId,
        user_id: userId,
      },
      transaction,
    });
  }

  async createUsage(
    input: PromotionUsageProps,
    transaction?: any,
  ): Promise<void> {
    await this.models.PromotionUsage.create(
      {
        promotion_id: input.promotionId,
        promotion_code_id: input.promotionCodeId ?? null,
        order_id: input.orderId,
        user_id: input.userId,
        discount_amount: Number(input.discountAmount ?? 0),
        shipping_discount_amount: Number(input.shippingDiscountAmount ?? 0),
        snapshot_json: input.snapshotJson ?? null,
      },
      { transaction },
    );
  }

  async incrementCodeUsage(codeId: number, transaction?: any): Promise<void> {
    await this.models.PromotionCode.increment("usage_count", {
      by: 1,
      where: { id: codeId },
      transaction,
    });
  }

  async listUsages(filter: PromotionUsageListFilter): Promise<{
    rows: Array<{
      id: number;
      promotionId: number;
      promotionCodeId?: number | null;
      orderId: number;
      userId: number;
      discountAmount: number;
      shippingDiscountAmount: number;
      snapshotJson?: Record<string, any> | null;
      createdAt?: Date;
    }>;
    count: number;
  }> {
    const page = Math.max(1, Number(filter.page ?? 1));
    const limit = Math.max(1, Number(filter.limit ?? 20));
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filter.promotionId) {
      where.promotion_id = Number(filter.promotionId);
    }

    if (filter.userId) {
      where.user_id = Number(filter.userId);
    }

    if (filter.orderId) {
      where.order_id = Number(filter.orderId);
    }

    const { rows, count } = await this.models.PromotionUsage.findAndCountAll({
      where,
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset,
    });

    return {
      count,
      rows: rows.map((row: any) => {
        const r = toPlain(row);
        return {
          id: Number(r.id),
          promotionId: Number(r.promotion_id),
          promotionCodeId:
            r.promotion_code_id !== null && r.promotion_code_id !== undefined
              ? Number(r.promotion_code_id)
              : null,
          orderId: Number(r.order_id),
          userId: Number(r.user_id),
          discountAmount: Number(r.discount_amount ?? 0),
          shippingDiscountAmount: Number(r.shipping_discount_amount ?? 0),
          snapshotJson: r.snapshot_json ?? null,
          createdAt: r.created_at ? new Date(r.created_at) : undefined,
        };
      }),
    };
  }
}
