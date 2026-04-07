import { DataTypes, Model } from "sequelize";
import sequelize from "../index";

class PostTagMapModel extends Model {}

PostTagMapModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    post_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },

    post_tag_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "post_tag_maps",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["post_id", "post_tag_id"],
        name: "uq_post_tag_map",
      },
      {
        fields: ["post_id"],
        name: "idx_post_tag_maps_post",
      },
      {
        fields: ["post_tag_id"],
        name: "idx_post_tag_maps_tag",
      },
    ],
  },
);

export default PostTagMapModel;
