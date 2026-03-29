import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type ShippingZoneAttributes = {
  id: number;
  code: string;
  name: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  base_fee: string;
  free_ship_threshold: string | null;
  priority: number;
  status: string;
  deleted: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type ShippingZoneCreationAttributes = Optional<
  ShippingZoneAttributes,
  | "id"
  | "province"
  | "district"
  | "ward"
  | "base_fee"
  | "free_ship_threshold"
  | "priority"
  | "status"
  | "deleted"
  | "deleted_at"
  | "created_at"
  | "updated_at"
>;

class ShippingZoneModel
  extends Model<ShippingZoneAttributes, ShippingZoneCreationAttributes>
  implements ShippingZoneAttributes
{
  declare id: number;
  declare code: string;
  declare name: string;
  declare province: string | null;
  declare district: string | null;
  declare ward: string | null;
  declare base_fee: string;
  declare free_ship_threshold: string | null;
  declare priority: number;
  declare status: string;
  declare deleted: number;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

ShippingZoneModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    province: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    district: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    ward: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    base_fee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    free_ship_threshold: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "shipping_zones",
    modelName: "ShippingZone",
    timestamps: false,
    indexes: [
      {
        name: "idx_shipping_zones_status_deleted_priority",
        fields: ["status", "deleted", "priority"],
      },
      {
        name: "idx_shipping_zones_province_district_ward",
        fields: ["province", "district", "ward"],
      },
    ],
  },
);

export default ShippingZoneModel;
