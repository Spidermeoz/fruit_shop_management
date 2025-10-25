// src/infrastructure/db/sequelize/models/UserModel.ts
import { DataTypes } from "sequelize";
import sequelize from "..";

const UserModel = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    role_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },

    full_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    // Lưu hash tại cột "password" (phổ biến trong project cũ)
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    api_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },

    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },

    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "banned"),
      allowNull: false,
      defaultValue: "active",
    },

    // Soft delete
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    // timestamps
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
    timestamps: true,
    underscored: true,
    paranoid: false,
  }
);

export default UserModel;
