import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type BranchAttributes = {
  id: number;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;
  latitude: string | null;
  longitude: string | null;
  open_time: string | null;
  close_time: string | null;
  supports_pickup: boolean;
  supports_delivery: boolean;
  status: string;
  deleted: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type BranchCreationAttributes = Optional<
  BranchAttributes,
  | "id"
  | "phone"
  | "email"
  | "address_line1"
  | "address_line2"
  | "ward"
  | "district"
  | "province"
  | "latitude"
  | "longitude"
  | "open_time"
  | "close_time"
  | "supports_pickup"
  | "supports_delivery"
  | "status"
  | "deleted"
  | "deleted_at"
  | "created_at"
  | "updated_at"
>;

class BranchModel
  extends Model<BranchAttributes, BranchCreationAttributes>
  implements BranchAttributes
{
  declare id: number;
  declare name: string;
  declare code: string;
  declare phone: string | null;
  declare email: string | null;
  declare address_line1: string | null;
  declare address_line2: string | null;
  declare ward: string | null;
  declare district: string | null;
  declare province: string | null;
  declare latitude: string | null;
  declare longitude: string | null;
  declare open_time: string | null;
  declare close_time: string | null;
  declare supports_pickup: boolean;
  declare supports_delivery: boolean;
  declare status: string;
  declare deleted: number;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

BranchModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    address_line1: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    address_line2: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    ward: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    district: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    province: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
    },
    open_time: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
    },
    close_time: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
    },
    supports_pickup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    supports_delivery: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
    },
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
    tableName: "branches",
    modelName: "Branch",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default BranchModel;
