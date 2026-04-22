import { DataTypes } from "sequelize";
import sequelize from "..";

const NotificationModel = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    event_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "system",
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "info",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    actor_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    target_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    meta_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    dedupe_key: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "active",
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: "notifications",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "uq_notifications_dedupe_deleted",
        unique: true,
        fields: ["dedupe_key", "deleted"],
      },
      { name: "idx_notifications_created", fields: ["created_at"] },
      {
        name: "idx_notifications_category_severity_created",
        fields: ["category", "severity", "created_at"],
      },
      {
        name: "idx_notifications_branch_created",
        fields: ["branch_id", "created_at"],
      },
      {
        name: "idx_notifications_entity",
        fields: ["entity_type", "entity_id"],
      },
      { name: "idx_notifications_actor", fields: ["actor_user_id"] },
      {
        name: "idx_notifications_status_deleted_created",
        fields: ["status", "deleted", "created_at"],
      },
    ],
  },
);

export default NotificationModel;
