import { DataTypes, Model } from "sequelize";
import sequelize from "../index";

class PostRelatedProductModel extends Model {}

PostRelatedProductModel.init(
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

    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },

    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "post_related_products",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["post_id", "product_id"],
        name: "uq_post_related_product",
      },
      {
        fields: ["post_id"],
        name: "idx_post_related_products_post",
      },
      {
        fields: ["product_id"],
        name: "idx_post_related_products_product",
      },
    ],
  },
);

export default PostRelatedProductModel;
