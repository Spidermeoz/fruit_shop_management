import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type DeliveryTimeSlotAttributes = {
  id: number;
  code: string;
  label: string;
  start_time: string;
  end_time: string;
  cutoff_minutes: number;
  max_orders: number | null;
  sort_order: number;
  status: string;
  deleted: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type DeliveryTimeSlotCreationAttributes = Optional<
  DeliveryTimeSlotAttributes,
  | "id"
  | "cutoff_minutes"
  | "max_orders"
  | "sort_order"
  | "status"
  | "deleted"
  | "deleted_at"
  | "created_at"
  | "updated_at"
>;

class DeliveryTimeSlotModel
  extends Model<DeliveryTimeSlotAttributes, DeliveryTimeSlotCreationAttributes>
  implements DeliveryTimeSlotAttributes
{
  declare id: number;
  declare code: string;
  declare label: string;
  declare start_time: string;
  declare end_time: string;
  declare cutoff_minutes: number;
  declare max_orders: number | null;
  declare sort_order: number;
  declare status: string;
  declare deleted: number;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

DeliveryTimeSlotModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    cutoff_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    max_orders: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "delivery_time_slots",
    modelName: "DeliveryTimeSlot",
    timestamps: false,
    indexes: [
      {
        unique: true,
        name: "uq_delivery_time_slots_code_deleted",
        fields: ["code", "deleted"],
      },
      {
        name: "idx_delivery_time_slots_status_deleted_sort",
        fields: ["status", "deleted", "sort_order"],
      },
    ],
  },
);

export default DeliveryTimeSlotModel;
