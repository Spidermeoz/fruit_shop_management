import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type BranchDeliverySlotCapacityAttributes = {
  id: number;
  branch_id: number;
  delivery_date: string;
  delivery_time_slot_id: number;
  max_orders: number | null;
  reserved_orders: number;
  status: string;
  created_at: Date;
  updated_at: Date;
};

type BranchDeliverySlotCapacityCreationAttributes = Optional<
  BranchDeliverySlotCapacityAttributes,
  | "id"
  | "max_orders"
  | "reserved_orders"
  | "status"
  | "created_at"
  | "updated_at"
>;

class BranchDeliverySlotCapacityModel
  extends Model<
    BranchDeliverySlotCapacityAttributes,
    BranchDeliverySlotCapacityCreationAttributes
  >
  implements BranchDeliverySlotCapacityAttributes
{
  declare id: number;
  declare branch_id: number;
  declare delivery_date: string;
  declare delivery_time_slot_id: number;
  declare max_orders: number | null;
  declare reserved_orders: number;
  declare status: string;
  declare created_at: Date;
  declare updated_at: Date;
}

BranchDeliverySlotCapacityModel.init(
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
    delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    delivery_time_slot_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    max_orders: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    reserved_orders: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
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
    tableName: "branch_delivery_slot_capacities",
    modelName: "BranchDeliverySlotCapacity",
    timestamps: false,
    indexes: [
      {
        unique: true,
        name: "uq_branch_delivery_slot_capacity",
        fields: ["branch_id", "delivery_date", "delivery_time_slot_id"],
      },
      {
        name: "idx_branch_delivery_slot_capacity_lookup",
        fields: ["branch_id", "delivery_date", "status"],
      },
    ],
  },
);

export default BranchDeliverySlotCapacityModel;
