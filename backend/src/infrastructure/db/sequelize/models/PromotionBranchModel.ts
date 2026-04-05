import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type PromotionBranchAttributes = {
  id: number;
  promotion_id: number;
  branch_id: number;
};

type PromotionBranchCreationAttributes = Optional<
  PromotionBranchAttributes,
  "id"
>;

class PromotionBranchModel
  extends Model<PromotionBranchAttributes, PromotionBranchCreationAttributes>
  implements PromotionBranchAttributes
{
  declare id: number;
  declare promotion_id: number;
  declare branch_id: number;
}

PromotionBranchModel.init(
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
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "promotion_branches",
    modelName: "PromotionBranch",
    timestamps: false,
  },
);

export default PromotionBranchModel;
