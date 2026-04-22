import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

interface ProductHealthCautionAttributes {
  id: number;
  product_id: number;
  source_id?: number | null;
  caution_type: string;
  caution_text: string;
  severity: string;
  status: string;
  reviewed_by_id?: number | null;
  reviewed_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
interface ProductHealthCautionCreationAttributes extends Optional<
  ProductHealthCautionAttributes,
  | "id"
  | "source_id"
  | "severity"
  | "status"
  | "reviewed_by_id"
  | "reviewed_at"
  | "created_at"
  | "updated_at"
> {}

class ProductHealthCautionModel
  extends Model<
    ProductHealthCautionAttributes,
    ProductHealthCautionCreationAttributes
  >
  implements ProductHealthCautionAttributes
{
  declare id: number;
  declare product_id: number;
  declare source_id: number | null;
  declare caution_type: string;
  declare caution_text: string;
  declare severity: string;
  declare status: string;
  declare reviewed_by_id: number | null;
  declare reviewed_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

ProductHealthCautionModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    source_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    caution_type: { type: DataTypes.STRING(100), allowNull: false },
    caution_text: { type: DataTypes.TEXT, allowNull: false },
    severity: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "medium",
    },
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
    tableName: "product_health_cautions",
    timestamps: true,
    underscored: true,
  },
);

export default ProductHealthCautionModel;
