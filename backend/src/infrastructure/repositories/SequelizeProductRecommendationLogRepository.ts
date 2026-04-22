import type {
  CreateProductRecommendationLogInput,
  ProductRecommendationLogRepository,
} from "../../domain/chat/ProductRecommendationLogRepository";
import type { ProductRecommendationLog } from "../../domain/chat/types";

type Models = { ProductRecommendationLog: any };

export class SequelizeProductRecommendationLogRepository implements ProductRecommendationLogRepository {
  constructor(private models: Models) {}

  private get model() {
    if (!this.models.ProductRecommendationLog)
      throw new Error("ProductRecommendationLog model is not configured");
    return this.models.ProductRecommendationLog;
  }

  private toEntity(row: any): ProductRecommendationLog {
    const r = typeof row?.get === "function" ? row.get({ plain: true }) : row;
    return {
      id: Number(r.id),
      chatSessionId: Number(r.chat_session_id),
      chatMessageId:
        r.chat_message_id != null ? Number(r.chat_message_id) : null,
      productId: Number(r.product_id),
      productVariantId:
        r.product_variant_id != null ? Number(r.product_variant_id) : null,
      rankPosition: Number(r.rank_position),
      score: r.score != null ? Number(r.score) : null,
      reason: r.reason ?? null,
      matchedTagsJson: r.matched_tags_json ?? null,
      matchedAttributesJson: r.matched_attributes_json ?? null,
      createdAt: r.created_at,
    };
  }

  async create(
    input: CreateProductRecommendationLogInput,
  ): Promise<ProductRecommendationLog> {
    const created = await this.model.create({
      chat_session_id: input.chatSessionId,
      chat_message_id: input.chatMessageId ?? null,
      product_id: input.productId,
      product_variant_id: input.productVariantId ?? null,
      rank_position: input.rankPosition,
      score: input.score ?? null,
      reason: input.reason ?? null,
      matched_tags_json: input.matchedTagsJson ?? null,
      matched_attributes_json: input.matchedAttributesJson ?? null,
    });
    return this.toEntity(created);
  }

  async createMany(
    inputs: CreateProductRecommendationLogInput[],
  ): Promise<ProductRecommendationLog[]> {
    if (!inputs.length) return [];
    const created = await this.model.bulkCreate(
      inputs.map((input) => ({
        chat_session_id: input.chatSessionId,
        chat_message_id: input.chatMessageId ?? null,
        product_id: input.productId,
        product_variant_id: input.productVariantId ?? null,
        rank_position: input.rankPosition,
        score: input.score ?? null,
        reason: input.reason ?? null,
        matched_tags_json: input.matchedTagsJson ?? null,
        matched_attributes_json: input.matchedAttributesJson ?? null,
      })),
    );
    return created.map((row: any) => this.toEntity(row));
  }

  async listBySessionId(
    chatSessionId: number,
  ): Promise<ProductRecommendationLog[]> {
    const rows = await this.model.findAll({
      where: { chat_session_id: chatSessionId },
      order: [["id", "ASC"]],
    });
    return rows.map((row: any) => this.toEntity(row));
  }
}
