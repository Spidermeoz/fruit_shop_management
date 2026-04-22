import type { NutritionReferenceSourceRepository } from "../../domain/chat/NutritionReferenceSourceRepository";
import type { NutritionReferenceSource } from "../../domain/chat/types";

type Models = { NutritionReferenceSource: any };

export class SequelizeNutritionReferenceSourceRepository implements NutritionReferenceSourceRepository {
  constructor(private models: Models) {}

  private get model() {
    if (!this.models.NutritionReferenceSource)
      throw new Error("NutritionReferenceSource model is not configured");
    return this.models.NutritionReferenceSource;
  }

  private toEntity(row: any): NutritionReferenceSource {
    const r = typeof row?.get === "function" ? row.get({ plain: true }) : row;
    return {
      id: Number(r.id),
      code: r.code,
      name: r.name,
      sourceType: r.source_type,
      homepageUrl: r.homepage_url ?? null,
      notes: r.notes ?? null,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async findById(id: number): Promise<NutritionReferenceSource | null> {
    const row = await this.model.findByPk(id);
    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<NutritionReferenceSource | null> {
    const row = await this.model.findOne({ where: { code } });
    return row ? this.toEntity(row) : null;
  }

  async listActive(): Promise<NutritionReferenceSource[]> {
    const rows = await this.model.findAll({
      where: { status: "active" },
      order: [["id", "ASC"]],
    });
    return rows.map((row: any) => this.toEntity(row));
  }
}
