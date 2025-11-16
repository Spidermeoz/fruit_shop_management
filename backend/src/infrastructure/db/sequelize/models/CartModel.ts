import { DataTypes } from "sequelize";
import sequelize from "..";

/**
 * Sequelize Model cho bảng `carts`
 * Map sát schema MySQL (id, user_id, created_at, updated_at)
 */
const CartModel = sequelize.define(
  "Cart",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
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
    tableName: "carts",
    timestamps: true,
    underscored: true, // created_at, updated_at
  }
);

export default CartModel;
