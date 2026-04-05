import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type PromotionCategoryAttributes = {
  id: number;
  promotion_id: number;
  product_category_id: number;
};

type PromotionCategoryCreationAttributes = Optional<
  PromotionCategoryAttributes,
  "id"
>;

class PromotionCategoryModel
  extends Model<
    PromotionCategoryAttributes,
    PromotionCategoryCreationAttributes
  >
  implements PromotionCategoryAttributes
{
  declare id: number;
  declare promotion_id: number;
  declare product_category_id: number;
}

PromotionCategoryModel.init(
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
    product_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "promotion_categories",
    modelName: "PromotionCategory",
    timestamps: false,
  },
);

export default PromotionCategoryModel;
