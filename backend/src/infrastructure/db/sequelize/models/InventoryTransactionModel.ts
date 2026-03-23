import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

type InventoryTransactionAttributes = {
  id: number;
  product_variant_id: number;
  transaction_type: string;
  quantity_delta: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  created_by_id: number | null;
  created_at: Date;
};

type InventoryTransactionCreationAttributes = Optional<
  InventoryTransactionAttributes,
  | "id"
  | "reference_type"
  | "reference_id"
  | "note"
  | "created_by_id"
  | "created_at"
>;

class InventoryTransactionModel
  extends Model<
    InventoryTransactionAttributes,
    InventoryTransactionCreationAttributes
  >
  implements InventoryTransactionAttributes
{
  declare id: number;
  declare product_variant_id: number;
  declare transaction_type: string;
  declare quantity_delta: number;
  declare quantity_before: number;
  declare quantity_after: number;
  declare reference_type: string | null;
  declare reference_id: number | null;
  declare note: string | null;
  declare created_by_id: number | null;
  declare created_at: Date;
}

InventoryTransactionModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    product_variant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    quantity_delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity_before: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    quantity_after: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    reference_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    created_by_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "inventory_transactions",
    modelName: "InventoryTransaction",
    timestamps: false,
  },
);

export default InventoryTransactionModel;
