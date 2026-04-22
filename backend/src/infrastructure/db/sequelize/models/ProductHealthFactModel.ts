import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

interface ProductHealthFactAttributes {
  id: number;
  product_id: number;
  source_id?: number | null;
  fact_key: string;
  fact_value_text?: string | null;
  fact_value_number?: number | null;
  unit?: string | null;
  evidence_note?: string | null;
  priority: number;
  status: string;
  reviewed_by_id?: number | null;
  reviewed_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
interface ProductHealthFactCreationAttributes extends Optional<
  ProductHealthFactAttributes,
  | "id"
  | "source_id"
  | "fact_value_text"
  | "fact_value_number"
  | "unit"
  | "evidence_note"
  | "priority"
  | "status"
  | "reviewed_by_id"
  | "reviewed_at"
  | "created_at"
  | "updated_at"
> {}

class ProductHealthFactModel
  extends Model<
    ProductHealthFactAttributes,
    ProductHealthFactCreationAttributes
  >
  implements ProductHealthFactAttributes
{
  declare id: number;
  declare product_id: number;
  declare source_id: number | null;
  declare fact_key: string;
  declare fact_value_text: string | null;
  declare fact_value_number: number | null;
  declare unit: string | null;
  declare evidence_note: string | null;
  declare priority: number;
  declare status: string;
  declare reviewed_by_id: number | null;
  declare reviewed_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

ProductHealthFactModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    source_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    fact_key: { type: DataTypes.STRING(100), allowNull: false },
    fact_value_text: { type: DataTypes.STRING(500), allowNull: true },
    fact_value_number: { type: DataTypes.DECIMAL(12, 4), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    evidence_note: { type: DataTypes.TEXT, allowNull: true },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
    },
    reviewed_by_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
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
    tableName: "product_health_facts",
    timestamps: true,
    underscored: true,
  },
);

export default ProductHealthFactModel;
