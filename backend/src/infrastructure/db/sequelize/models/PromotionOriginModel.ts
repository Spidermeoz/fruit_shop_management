import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type PromotionOriginAttributes = {
  id: number;
  promotion_id: number;
  origin_id: number;
};

type PromotionOriginCreationAttributes = Optional<
  PromotionOriginAttributes,
  "id"
>;

class PromotionOriginModel
  extends Model<PromotionOriginAttributes, PromotionOriginCreationAttributes>
  implements PromotionOriginAttributes
{
  declare id: number;
  declare promotion_id: number;
  declare origin_id: number;
}

PromotionOriginModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    promotion_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    origin_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "promotion_origins",
    modelName: "PromotionOrigin",
    timestamps: false,
  },
);

export default PromotionOriginModel;
