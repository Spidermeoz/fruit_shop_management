import { DataTypes, Model } from "sequelize";
import sequelize from "../index";

export class ForgotPasswordModel extends Model {
  public id!: number;
  public email!: string;
  public otp!: string;
  public expire_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ForgotPasswordModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: { type: DataTypes.STRING, allowNull: false },
    otp: { type: DataTypes.STRING(20), allowNull: false },
    expire_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "forgot_password", sequelize, timestamps: false }
);
