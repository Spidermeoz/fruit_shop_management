import { DataTypes } from "sequelize";
import sequelize from "..";

const AuditLogModel = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    actor_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    actor_role_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    module_name: {
      type: DataTypes.STRING(100),
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
    request_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    http_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    route_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    old_values_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    new_values_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    meta_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "audit_logs",
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        name: "idx_audit_logs_actor_created",
        fields: ["actor_user_id", "created_at"],
      },
      {
        name: "idx_audit_logs_role_created",
        fields: ["actor_role_id", "created_at"],
      },
      {
        name: "idx_audit_logs_module_action_created",
        fields: ["module_name", "action", "created_at"],
      },
      {
        name: "idx_audit_logs_branch_created",
        fields: ["branch_id", "created_at"],
      },
      { name: "idx_audit_logs_entity", fields: ["entity_type", "entity_id"] },
      { name: "idx_audit_logs_request", fields: ["request_id"] },
    ],
  },
);

export default AuditLogModel;
