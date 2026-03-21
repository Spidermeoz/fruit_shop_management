import { DataTypes, Model } from "sequelize";
import sequelize from "..";

class ProductVariantValueModel extends Model {}

ProductVariantValueModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    product_variant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    product_option_value_id: {
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
    tableName: "product_variant_values",
    timestamps: false,
    underscored: true,
  },
);

export default ProductVariantValueModel;
