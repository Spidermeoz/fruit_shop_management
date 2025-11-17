import { DataTypes, Model } from "sequelize";
import sequelize from "../index";

class OrderModel extends Model {}

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
    timestamps: false,
  }
);

export default OrderModel;
