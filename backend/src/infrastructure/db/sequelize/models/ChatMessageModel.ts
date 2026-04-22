import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

interface ChatMessageAttributes {
  id: number;
  chat_session_id: number;
  sender_type: string;
  message_type: string;
  content: string;
  intent?: string | null;
  extracted_filters_json?: Record<string, any> | null;
  model_name?: string | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  latency_ms?: number | null;
  created_at?: Date;
}
interface ChatMessageCreationAttributes extends Optional<
  ChatMessageAttributes,
  | "id"
  | "message_type"
  | "intent"
  | "extracted_filters_json"
  | "model_name"
  | "prompt_tokens"
  | "completion_tokens"
  | "latency_ms"
  | "created_at"
> {}

class ChatMessageModel
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes
{
  declare id: number;
  declare chat_session_id: number;
  declare sender_type: string;
  declare message_type: string;
  declare content: string;
  declare intent: string | null;
  declare extracted_filters_json: Record<string, any> | null;
  declare model_name: string | null;
  declare prompt_tokens: number | null;
  declare completion_tokens: number | null;
  declare latency_ms: number | null;
  declare created_at: Date;
}

ChatMessageModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    chat_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sender_type: { type: DataTypes.STRING(20), allowNull: false },
    message_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "text",
    },
    content: { type: DataTypes.TEXT("long"), allowNull: false },
    intent: { type: DataTypes.STRING(100), allowNull: true },
    extracted_filters_json: { type: DataTypes.JSON, allowNull: true },
    model_name: { type: DataTypes.STRING(100), allowNull: true },
    prompt_tokens: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    completion_tokens: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    latency_ms: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "chat_messages",
    timestamps: false,
    underscored: true,
  },
);

export default ChatMessageModel;
