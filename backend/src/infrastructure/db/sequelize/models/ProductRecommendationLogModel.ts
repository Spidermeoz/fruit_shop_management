import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

interface ProductRecommendationLogAttributes {
  id: number;
  chat_session_id: number;
  chat_message_id?: number | null;
  product_id: number;
  product_variant_id?: number | null;
  rank_position: number;
  score?: number | null;
  reason?: string | null;
  matched_tags_json?: string[] | null;
  matched_attributes_json?: Record<string, any> | null;
  created_at?: Date;
}
interface ProductRecommendationLogCreationAttributes extends Optional<
  ProductRecommendationLogAttributes,
  | "id"
  | "chat_message_id"
  | "product_variant_id"
  | "score"
  | "reason"
  | "matched_tags_json"
  | "matched_attributes_json"
  | "created_at"
> {}

class ProductRecommendationLogModel
  extends Model<
    ProductRecommendationLogAttributes,
    ProductRecommendationLogCreationAttributes
  >
  implements ProductRecommendationLogAttributes
{
  declare id: number;
  declare chat_session_id: number;
  declare chat_message_id: number | null;
  declare product_id: number;
  declare product_variant_id: number | null;
  declare rank_position: number;
  declare score: number | null;
  declare reason: string | null;
  declare matched_tags_json: string[] | null;
  declare matched_attributes_json: Record<string, any> | null;
  declare created_at: Date;
}

ProductRecommendationLogModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    chat_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    chat_message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    product_variant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    rank_position: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    score: { type: DataTypes.DECIMAL(8, 4), allowNull: true },
    reason: { type: DataTypes.STRING(500), allowNull: true },
    matched_tags_json: { type: DataTypes.JSON, allowNull: true },
    matched_attributes_json: { type: DataTypes.JSON, allowNull: true },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "product_recommendation_logs",
    timestamps: false,
    underscored: true,
  },
);

export default ProductRecommendationLogModel;
