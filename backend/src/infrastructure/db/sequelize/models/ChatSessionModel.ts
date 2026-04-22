import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

interface ChatSessionAttributes {
  id: number;
  user_id?: number | null;
  session_token: string;
  channel: string;
  status: string;
  started_at?: Date;
  ended_at?: Date | null;
  last_message_at?: Date | null;
  metadata_json?: Record<string, any> | null;
  created_at?: Date;
  updated_at?: Date;
}
interface ChatSessionCreationAttributes extends Optional<
  ChatSessionAttributes,
  | "id"
  | "user_id"
  | "channel"
  | "status"
  | "started_at"
  | "ended_at"
  | "last_message_at"
  | "metadata_json"
  | "created_at"
  | "updated_at"
> {}

class ChatSessionModel
  extends Model<ChatSessionAttributes, ChatSessionCreationAttributes>
  implements ChatSessionAttributes
{
  declare id: number;
  declare user_id: number | null;
  declare session_token: string;
  declare channel: string;
  declare status: string;
  declare started_at: Date;
  declare ended_at: Date | null;
  declare last_message_at: Date | null;
  declare metadata_json: Record<string, any> | null;
  declare created_at: Date;
  declare updated_at: Date;
}

ChatSessionModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    session_token: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    channel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "web",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ended_at: { type: DataTypes.DATE, allowNull: true },
    last_message_at: { type: DataTypes.DATE, allowNull: true },
    metadata_json: { type: DataTypes.JSON, allowNull: true },
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
    tableName: "chat_sessions",
    timestamps: true,
    underscored: true,
  },
);

export default ChatSessionModel;
