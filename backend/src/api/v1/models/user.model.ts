import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../../config/database";
import Role from "./role.model";

// ==============================
// TypeScript interfaces
// ==============================
interface UserAttributes {
  id: number;
  role_id?: number | null;
  full_name?: string | null;
  email: string;
  password: string;
  api_token?: string | null;
  phone?: string | null;
  avatar?: string | null;
  status?: "active" | "inactive" | "banned";
  deleted?: number;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type UserCreationAttributes = Optional<
  UserAttributes,
  | "id"
  | "role_id"
  | "full_name"
  | "api_token"
  | "phone"
  | "avatar"
  | "status"
  | "deleted"
  | "deleted_at"
  | "created_at"
  | "updated_at"
>;

// ==============================
// Model class
// ==============================
class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number;
  public role_id!: number | null;
  public full_name!: string | null;
  public email!: string;
  public password!: string;
  public api_token!: string | null;
  public phone!: string | null;
  public avatar!: string | null;
  public status!: "active" | "inactive";
  public deleted!: number;
  public deleted_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public role?: Role;
}

// ==============================
// Model definition
// ==============================
User.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    api_token: {
      type: DataTypes.STRING(80),
      allowNull: true,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
      validate: {
        isIn: [["active", "inactive", "banned"]],
      },
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
    tableName: "users",
    sequelize,
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// ==============================
// Associations
// ==============================
User.belongsTo(Role, {
  foreignKey: "role_id",
  as: "role",
  onUpdate: "CASCADE",
  onDelete: "SET NULL",
});

Role.hasMany(User, {
  foreignKey: "role_id",
  as: "users",
  onUpdate: "CASCADE",
  onDelete: "SET NULL",
});

export default User;
