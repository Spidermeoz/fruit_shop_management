import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type PromotionCodeStatus = "active" | "inactive";

export type PromotionCodeAttributes = {
  id: number;
  promotion_id: number;
  code: string;
  status: PromotionCodeStatus;
  deleted: number;
  deleted_at: Date | null;
  usage_limit: number | null;
  usage_count: number;
  start_at: Date | null;
  end_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type PromotionCodeCreationAttributes = Optional<
  PromotionCodeAttributes,
  | "id"
  | "status"
  | "deleted"
  | "deleted_at"
  | "usage_limit"
  | "usage_count"
  | "start_at"
  | "end_at"
  | "created_at"
  | "updated_at"
>;

class PromotionCodeModel
  extends Model<PromotionCodeAttributes, PromotionCodeCreationAttributes>
  implements PromotionCodeAttributes
{
  declare id: number;
  declare promotion_id: number;
  declare code: string;
  declare status: PromotionCodeStatus;
  declare deleted: number;
  declare deleted_at: Date | null;
  declare usage_limit: number | null;
  declare usage_count: number;
  declare start_at: Date | null;
  declare end_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

PromotionCodeModel.init(
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
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
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
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    usage_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "promotion_codes",
    modelName: "PromotionCode",
    timestamps: false,
    indexes: [
      {
        name: "idx_promotion_codes_promotion_status",
        fields: ["promotion_id", "status"],
      },
      {
        name: "idx_promotion_codes_status_time",
        fields: ["status", "start_at", "end_at"],
      },
    ],
  },
);

export default PromotionCodeModel;
