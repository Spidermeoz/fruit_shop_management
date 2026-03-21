import { DataTypes, Model } from "sequelize";
import sequelize from "../index";

class ProductReviewModel extends Model {}

ProductReviewModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },

    product_variant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },

    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },

    parent_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "approved",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "product_reviews",
    timestamps: false,
    underscored: true,
  },
);

export default ProductReviewModel;
