import { DataTypes } from "sequelize";
import sequelize from "..";

/**
 * Sequelize Model cho bảng `cart_items`
 * (id, cart_id, product_id, quantity, created_at, updated_at)
 */
const CartItemModel = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    cart_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
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
    tableName: "cart_items",
    timestamps: true,
    underscored: true,
  }
);

export default CartItemModel;
