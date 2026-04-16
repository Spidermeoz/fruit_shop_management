import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type BranchServiceAreaAttributes = {
  id: number;
  branch_id: number;
  shipping_zone_id: number;
  delivery_fee_override: string | null;
  min_order_value: string | null;
  max_order_value: string | null;
  supports_same_day: number;
  status: string;
  deleted: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type BranchServiceAreaCreationAttributes = Optional<
  BranchServiceAreaAttributes,
  | "id"
  | "delivery_fee_override"
  | "min_order_value"
  | "max_order_value"
  | "supports_same_day"
  | "status"
  | "deleted"
  | "deleted_at"
  | "created_at"
  | "updated_at"
>;

class BranchServiceAreaModel
  extends Model<
    BranchServiceAreaAttributes,
    BranchServiceAreaCreationAttributes
  >
  implements BranchServiceAreaAttributes
{
  declare id: number;
  declare branch_id: number;
  declare shipping_zone_id: number;
  declare delivery_fee_override: string | null;
  declare min_order_value: string | null;
  declare max_order_value: string | null;
  declare supports_same_day: number;
  declare status: string;
  declare deleted: number;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

BranchServiceAreaModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    shipping_zone_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    delivery_fee_override: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    min_order_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    max_order_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    supports_same_day: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.STRING(50),
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
    tableName: "branch_service_areas",
    modelName: "BranchServiceArea",
    timestamps: false,
    indexes: [
      {
        unique: true,
        name: "uq_branch_service_areas_branch_zone_deleted",
        fields: ["branch_id", "shipping_zone_id", "deleted"],
      },
      {
        name: "idx_branch_service_areas_zone",
        fields: ["shipping_zone_id"],
      },
      {
        name: "idx_branch_service_areas_branch_status_deleted",
        fields: ["branch_id", "status", "deleted"],
      },
      {
        name: "idx_branch_service_areas_zone_status_deleted",
        fields: ["shipping_zone_id", "status", "deleted"],
      },
      {
        name: "idx_branch_service_areas_branch_same_day_status_deleted",
        fields: ["branch_id", "supports_same_day", "status", "deleted"],
      },
    ],
  },
);

export default BranchServiceAreaModel;
