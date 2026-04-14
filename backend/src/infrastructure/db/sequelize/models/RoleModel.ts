// src/infrastructure/db/sequelize/models/RoleModel.ts
import { DataTypes } from "sequelize";
import sequelize from "..";

const RoleModel = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    scope: {
      type: DataTypes.ENUM("system", "branch", "client"),
      allowNull: false,
      defaultValue: "branch",
    },

    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 10,
    },

    is_assignable: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },

    is_protected: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
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
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
);

export default RoleModel;
