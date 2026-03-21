import { DataTypes, Model } from "sequelize";
import sequelize from "..";

class ProductOptionValueModel extends Model {}

ProductOptionValueModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    product_option_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(100),
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "product_option_values",
    timestamps: true,
    underscored: true,
  },
);

export default ProductOptionValueModel;
