import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

interface NutritionReferenceSourceAttributes {
  id: number;
  code: string;
  name: string;
  source_type: string;
  homepage_url?: string | null;
  notes?: string | null;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}
interface NutritionReferenceSourceCreationAttributes extends Optional<
  NutritionReferenceSourceAttributes,
  | "id"
  | "source_type"
  | "homepage_url"
  | "notes"
  | "status"
  | "created_at"
  | "updated_at"
> {}

class NutritionReferenceSourceModel
  extends Model<
    NutritionReferenceSourceAttributes,
    NutritionReferenceSourceCreationAttributes
  >
  implements NutritionReferenceSourceAttributes
{
  declare id: number;
  declare code: string;
  declare name: string;
  declare source_type: string;
  declare homepage_url: string | null;
  declare notes: string | null;
  declare status: string;
  declare created_at: Date;
  declare updated_at: Date;
}

NutritionReferenceSourceModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    source_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "reference",
    },
    homepage_url: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
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
    tableName: "nutrition_reference_sources",
    timestamps: true,
    underscored: true,
  },
);

export default NutritionReferenceSourceModel;
