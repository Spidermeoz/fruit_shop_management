import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type PromotionScope = "order" | "shipping";
export type PromotionDiscountType = "fixed" | "percent" | "free_shipping";
export type PromotionStatus = "active" | "inactive";

export type PromotionAttributes = {
  id: number;
  name: string;
  description: string | null;
  promotion_scope: PromotionScope;
  discount_type: PromotionDiscountType;
  discount_value: string;
  max_discount_amount: string | null;
  min_order_value: string | null;
  is_auto_apply: boolean;
  can_combine: boolean;
  priority: number;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  start_at: Date | null;
  end_at: Date | null;
  status: PromotionStatus;
  deleted: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type PromotionCreationAttributes = Optional<
  PromotionAttributes,
  | "id"
  | "description"
  | "promotion_scope"
  | "discount_value"
  | "max_discount_amount"
  | "min_order_value"
  | "is_auto_apply"
  | "can_combine"
  | "priority"
  | "usage_limit"
  | "usage_limit_per_user"
  | "start_at"
  | "end_at"
  | "status"
  | "deleted"
  | "deleted_at"
  | "created_at"
  | "updated_at"
>;

class PromotionModel
  extends Model<PromotionAttributes, PromotionCreationAttributes>
  implements PromotionAttributes
{
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare promotion_scope: PromotionScope;
  declare discount_type: PromotionDiscountType;
  declare discount_value: string;
  declare max_discount_amount: string | null;
  declare min_order_value: string | null;
  declare is_auto_apply: boolean;
  declare can_combine: boolean;
  declare priority: number;
  declare usage_limit: number | null;
  declare usage_limit_per_user: number | null;
  declare start_at: Date | null;
  declare end_at: Date | null;
  declare status: PromotionStatus;
  declare deleted: number;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

PromotionModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    promotion_scope: {
      type: DataTypes.ENUM("order", "shipping"),
      allowNull: false,
      defaultValue: "order",
    },
    discount_type: {
      type: DataTypes.ENUM("fixed", "percent", "free_shipping"),
      allowNull: false,
    },
    discount_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    max_discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    min_order_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    is_auto_apply: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    can_combine: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    usage_limit_per_user: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "promotions",
    modelName: "Promotion",
    timestamps: false,
    indexes: [
      {
        name: "idx_promotions_status",
        fields: ["status"],
      },
      {
        name: "idx_promotions_scope",
        fields: ["promotion_scope"],
      },
      {
        name: "idx_promotions_time",
        fields: ["start_at", "end_at"],
      },
      {
        name: "idx_promotions_active_lookup",
        fields: [
          "status",
          "deleted",
          "is_auto_apply",
          "can_combine",
          "priority",
        ],
      },
    ],
  },
);

export default PromotionModel;
