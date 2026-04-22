import { Op } from "sequelize";
import type { ProductHealthFactRepository } from "../../domain/chat/ProductHealthFactRepository";
import type { ProductHealthFact } from "../../domain/chat/types";

type Models = { ProductHealthFact: any };

export class SequelizeProductHealthFactRepository implements ProductHealthFactRepository {
  constructor(private models: Models) {}

  private get model() {
    if (!this.models.ProductHealthFact)
      throw new Error("ProductHealthFact model is not configured");
    return this.models.ProductHealthFact;
  }

  private toEntity(row: any): ProductHealthFact {
    const r = typeof row?.get === "function" ? row.get({ plain: true }) : row;
    return {
      id: Number(r.id),
      productId: Number(r.product_id),
      sourceId: r.source_id != null ? Number(r.source_id) : null,
      factKey: r.fact_key,
      factValueText: r.fact_value_text ?? null,
      factValueNumber:
        r.fact_value_number != null ? Number(r.fact_value_number) : null,
      unit: r.unit ?? null,
      evidenceNote: r.evidence_note ?? null,
      priority: Number(r.priority ?? 0),
      status: r.status,
      reviewedById: r.reviewed_by_id != null ? Number(r.reviewed_by_id) : null,
      reviewedAt: r.reviewed_at ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async listByProductId(productId: number): Promise<ProductHealthFact[]> {
    const rows = await this.model.findAll({
      where: { product_id: productId, status: "active" },
      order: [
        ["priority", "DESC"],
        ["id", "ASC"],
      ],
    });
    return rows.map((row: any) => this.toEntity(row));
  }

  async listByProductIds(productIds: number[]): Promise<ProductHealthFact[]> {
    if (!productIds.length) return [];
    const rows = await this.model.findAll({
      where: { product_id: { [Op.in]: productIds }, status: "active" },
      order: [
        ["priority", "DESC"],
        ["id", "ASC"],
      ],
    });
    return rows.map((row: any) => this.toEntity(row));
  }
}
