import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type PromotionVariantAttributes = {
  id: number;
  promotion_id: number;
  product_variant_id: number;
};

type PromotionVariantCreationAttributes = Optional<
  PromotionVariantAttributes,
  "id"
>;

class PromotionVariantModel
  extends Model<PromotionVariantAttributes, PromotionVariantCreationAttributes>
  implements PromotionVariantAttributes
{
  declare id: number;
  declare promotion_id: number;
  declare product_variant_id: number;
}

PromotionVariantModel.init(
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
    product_variant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "promotion_variants",
    modelName: "PromotionVariant",
    timestamps: false,
  },
);

export default PromotionVariantModel;
