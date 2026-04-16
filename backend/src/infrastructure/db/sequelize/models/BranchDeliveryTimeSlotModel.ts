import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type BranchDeliveryTimeSlotAttributes = {
  id: number;
  branch_id: number;
  delivery_time_slot_id: number;
  max_orders_override: number | null;
  status: string;
  deleted: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type BranchDeliveryTimeSlotCreationAttributes = Optional<
  BranchDeliveryTimeSlotAttributes,
  | "id"
  | "max_orders_override"
  | "status"
  | "deleted"
  | "deleted_at"
  | "created_at"
  | "updated_at"
>;

class BranchDeliveryTimeSlotModel
  extends Model<
    BranchDeliveryTimeSlotAttributes,
    BranchDeliveryTimeSlotCreationAttributes
  >
  implements BranchDeliveryTimeSlotAttributes
{
  declare id: number;
  declare branch_id: number;
  declare delivery_time_slot_id: number;
  declare max_orders_override: number | null;
  declare status: string;
  declare deleted: number;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

BranchDeliveryTimeSlotModel.init(
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
    delivery_time_slot_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    max_orders_override: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
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
    tableName: "branch_delivery_time_slots",
    modelName: "BranchDeliveryTimeSlot",
    timestamps: false,
    indexes: [
      {
        unique: true,
        name: "uq_branch_delivery_time_slots_branch_slot_deleted",
        fields: ["branch_id", "delivery_time_slot_id", "deleted"],
      },
      {
        name: "idx_branch_delivery_time_slots_slot",
        fields: ["delivery_time_slot_id"],
      },
      {
        name: "idx_branch_delivery_time_slots_branch_status_deleted",
        fields: ["branch_id", "status", "deleted"],
      },
      {
        name: "idx_branch_delivery_time_slots_branch_slot_status_deleted",
        fields: ["branch_id", "delivery_time_slot_id", "status", "deleted"],
      },
    ],
  },
);

export default BranchDeliveryTimeSlotModel;
