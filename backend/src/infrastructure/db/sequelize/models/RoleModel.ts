// src/infrastructure/db/sequelize/models/RoleModel.ts
import { DataTypes } from "sequelize";
import sequelize from "..";

/**
 * Bảng: roles
 * - permissions: dùng JSON (MySQL 5.7+). Nếu DB bạn đang là TEXT, vẫn có thể map ở Repo (parse chuỗi).
 * - deleted: soft-delete dạng TINYINT(1).
 */
const RoleModel = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
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

    // JSON / TEXT tuỳ DB — ở Repo mình sẽ parse an toàn nếu nhận về string
    permissions: {
      type: DataTypes.JSON, // nếu DB là TEXT, có thể đổi sang TEXT và parse ở getter/setter
      allowNull: true,
    },

    // Soft delete flags
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: "roles",
    timestamps: true,
    underscored: true,
    paranoid: false,
  }
);

export default RoleModel;
