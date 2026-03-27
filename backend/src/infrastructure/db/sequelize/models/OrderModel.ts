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
