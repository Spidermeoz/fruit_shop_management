import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type PromotionUsageAttributes = {
  id: number;
  promotion_id: number;
  promotion_code_id: number | null;
  order_id: number;
  user_id: number;
  discount_amount: string;
  shipping_discount_amount: string;
  snapshot_json: object | null;
  created_at: Date;
};

type PromotionUsageCreationAttributes = Optional<
  PromotionUsageAttributes,
  | "id"
  | "promotion_code_id"
  | "discount_amount"
  | "shipping_discount_amount"
  | "snapshot_json"
  | "created_at"
>;

class PromotionUsageModel
  extends Model<PromotionUsageAttributes, PromotionUsageCreationAttributes>
  implements PromotionUsageAttributes
{
  declare id: number;
  declare promotion_id: number;
  declare promotion_code_id: number | null;
  declare order_id: number;
  declare user_id: number;
  declare discount_amount: string;
  declare shipping_discount_amount: string;
  declare snapshot_json: object | null;
  declare created_at: Date;
}

PromotionUsageModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    promotion_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    promotion_code_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    shipping_discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    snapshot_json: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "promotion_usages",
    modelName: "PromotionUsage",
    timestamps: false,
    indexes: [
      {
        name: "idx_promotion_usage_user",
        fields: ["user_id"],
      },
      {
        name: "idx_promotion_usage_promotion",
        fields: ["promotion_id"],
      },
      {
        name: "idx_promotion_usages_promotion_user",
        fields: ["promotion_id", "user_id"],
      },
      {
        name: "idx_promotion_usages_code",
        fields: ["promotion_code_id"],
      },
      {
        name: "idx_promotion_usages_order",
        fields: ["order_id"],
      },
      {
        name: "idx_promotion_usages_order_promotion",
        fields: ["order_id", "promotion_id"],
      },
    ],
  },
);

export default PromotionUsageModel;
