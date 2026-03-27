import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../index";

export type UserBranchAttributes = {
  id: number;
  user_id: number;
  branch_id: number;
  is_primary: boolean;
  created_at: Date;
};

type UserBranchCreationAttributes = Optional<
  UserBranchAttributes,
  "id" | "is_primary" | "created_at"
>;

class UserBranchModel
  extends Model<UserBranchAttributes, UserBranchCreationAttributes>
  implements UserBranchAttributes
{
  declare id: number;
  declare user_id: number;
  declare branch_id: number;
  declare is_primary: boolean;
  declare created_at: Date;
}

UserBranchModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "user_branches",
    modelName: "UserBranch",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "branch_id"],
        name: "uq_user_branches_user_branch",
      },
      {
        fields: ["branch_id"],
        name: "idx_user_branches_branch",
      },
      {
        fields: ["user_id", "is_primary"],
        name: "idx_user_branches_user_primary",
      },
    ],
  },
);

export default UserBranchModel;
