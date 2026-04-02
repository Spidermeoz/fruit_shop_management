import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

type OrderAttributes = {
  id: number;
  user_id: number;
  branch_id: number;
  code: string;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  delivery_type: string;
  delivery_date: string | null;
  delivery_time_slot_id: number | null;
  delivery_time_slot_label: string | null;
  shipping_zone_id: number | null;
  shipping_zone_code: string | null;
  shipping_zone_name: string | null;
  delivery_note: string | null;
  shipping_fee: string;
  discount_amount: string;
  total_price: string;
  final_price: string | null;
  tracking_token: string;
  inventory_applied: number;
  user_info: object | null;
  deleted: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type OrderCreationAttributes = Optional<
  OrderAttributes,
  | "id"
  | "fulfillment_type"
  | "shipping_fee"
  | "discount_amount"
  | "final_price"
  | "inventory_applied"
  | "user_info"
  | "delivery_type"
  | "delivery_date"
  | "delivery_time_slot_id"
  | "delivery_time_slot_label"
  | "shipping_zone_id"
  | "shipping_zone_code"
  | "shipping_zone_name"
  | "delivery_note"
  | "deleted"
  | "deleted_at"
  | "created_at"
  | "updated_at"
>;

class OrderModel
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  declare id: number;
  declare user_id: number;
  declare branch_id: number;
  declare code: string;
  declare status: string;
  declare payment_status: string;
  declare fulfillment_type: string;
  declare shipping_fee: string;
  declare discount_amount: string;
  declare total_price: string;
  declare final_price: string | null;
  declare tracking_token: string;
  declare inventory_applied: number;
  declare user_info: object | null;
  declare delivery_type: string;
  declare delivery_date: string | null;
  declare delivery_time_slot_id: number | null;
  declare delivery_time_slot_label: string | null;
  declare shipping_zone_id: number | null;
  declare shipping_zone_code: string | null;
  declare shipping_zone_name: string | null;
  declare delivery_note: string | null;
  declare deleted: number;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

OrderModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "pending",
    },
    payment_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "unpaid",
    },
    fulfillment_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "delivery",
    },
    delivery_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "standard",
    },
    delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
    },
    delivery_time_slot_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    delivery_time_slot_label: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    shipping_zone_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    shipping_zone_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    shipping_zone_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    delivery_note: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    shipping_fee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    final_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      get() {
        return this.getDataValue("final_price");
      },
    },
    tracking_token: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    inventory_applied: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    user_info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: "orders",
    modelName: "Order",
    timestamps: false,
    indexes: [
      {
        fields: ["branch_id", "created_at"],
        name: "idx_orders_branch_created",
      },
    ],
  },
);

export default OrderModel;
