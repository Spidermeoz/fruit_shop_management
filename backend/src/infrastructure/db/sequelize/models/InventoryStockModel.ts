import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

type InventoryStockAttributes = {
  id: number;
  branch_id: number;
  product_variant_id: number;
  quantity: number;
  reserved_quantity: number;
  created_at: Date;
  updated_at: Date;
};

type InventoryStockCreationAttributes = Optional<
  InventoryStockAttributes,
  "id" | "reserved_quantity" | "created_at" | "updated_at"
>;

class InventoryStockModel
  extends Model<InventoryStockAttributes, InventoryStockCreationAttributes>
  implements InventoryStockAttributes
{
  declare id: number;
  declare branch_id: number;
  declare product_variant_id: number;
  declare quantity: number;
  declare reserved_quantity: number;
  declare created_at: Date;
  declare updated_at: Date;
}

InventoryStockModel.init(
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
    product_variant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    reserved_quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "inventory_stocks",
    modelName: "InventoryStock",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["branch_id"],
        name: "idx_inventory_stocks_branch",
      },
      {
        unique: true,
        fields: ["branch_id", "product_variant_id"],
        name: "uq_inventory_stocks_branch_variant",
      },
    ],
  },
);

export default InventoryStockModel;
