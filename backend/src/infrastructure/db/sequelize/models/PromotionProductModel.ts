import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type PromotionProductAttributes = {
  id: number;
  promotion_id: number;
  product_id: number;
};

type PromotionProductCreationAttributes = Optional<
  PromotionProductAttributes,
  "id"
>;

class PromotionProductModel
  extends Model<PromotionProductAttributes, PromotionProductCreationAttributes>
  implements PromotionProductAttributes
{
  declare id: number;
  declare promotion_id: number;
  declare product_id: number;
}

PromotionProductModel.init(
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
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "promotion_products",
    modelName: "PromotionProduct",
    timestamps: false,
  },
);

export default PromotionProductModel;
