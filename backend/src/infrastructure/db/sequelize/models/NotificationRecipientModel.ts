import { DataTypes } from "sequelize";
import sequelize from "..";

const NotificationRecipientModel = sequelize.define(
  "NotificationRecipient",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    notification_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_hidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hidden_at: {
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
    tableName: "notification_recipients",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "uq_notification_recipients_notification_user",
        unique: true,
        fields: ["notification_id", "user_id"],
      },
      {
        name: "idx_notification_recipients_user_unread",
        fields: ["user_id", "is_read", "is_hidden", "created_at"],
      },
      {
        name: "idx_notification_recipients_notification",
        fields: ["notification_id"],
      },
    ],
  },
);

export default NotificationRecipientModel;
