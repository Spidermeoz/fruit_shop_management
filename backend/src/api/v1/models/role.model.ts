import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../../config/database";

// ==============================
// TypeScript interfaces
// ==============================
interface RoleAttributes {
  id: number;
  title: string;
  description?: string | null;
  permissions?: object | null; // JSON field
  deleted?: number;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type RoleCreationAttributes = Optional<
  RoleAttributes,
  "id" | "description" | "permissions" | "deleted" | "deleted_at" | "created_at" | "updated_at"
>;

// ==============================
// Model definition
// ==============================
class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public title!: string;
  public description!: string | null;
  public permissions!: object | null;
  public deleted!: number;
  public deleted_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissions: {
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
    tableName: "roles",
    sequelize,
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Role;
