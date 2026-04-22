import { Op } from "sequelize";
import type { ProductHealthCautionRepository } from "../../domain/chat/ProductHealthCautionRepository";
import type { ProductHealthCaution } from "../../domain/chat/types";

type Models = { ProductHealthCaution: any };

export class SequelizeProductHealthCautionRepository implements ProductHealthCautionRepository {
  constructor(private models: Models) {}

  private get model() {
    if (!this.models.ProductHealthCaution)
      throw new Error("ProductHealthCaution model is not configured");
    return this.models.ProductHealthCaution;
  }

  private toEntity(row: any): ProductHealthCaution {
    const r = typeof row?.get === "function" ? row.get({ plain: true }) : row;
    return {
      id: Number(r.id),
      productId: Number(r.product_id),
      sourceId: r.source_id != null ? Number(r.source_id) : null,
      cautionType: r.caution_type,
      cautionText: r.caution_text,
      severity: r.severity,
      status: r.status,
      reviewedById: r.reviewed_by_id != null ? Number(r.reviewed_by_id) : null,
      reviewedAt: r.reviewed_at ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async listActiveByProductId(
    productId: number,
  ): Promise<ProductHealthCaution[]> {
    const rows = await this.model.findAll({
      where: { product_id: productId, status: "active" },
      order: [["id", "ASC"]],
    });
    return rows.map((row: any) => this.toEntity(row));
  }

  async listActiveByProductIds(
    productIds: number[],
  ): Promise<ProductHealthCaution[]> {
    if (!productIds.length) return [];
    const rows = await this.model.findAll({
      where: { product_id: { [Op.in]: productIds }, status: "active" },
      order: [["id", "ASC"]],
    });
    return rows.map((row: any) => this.toEntity(row));
  }
}
