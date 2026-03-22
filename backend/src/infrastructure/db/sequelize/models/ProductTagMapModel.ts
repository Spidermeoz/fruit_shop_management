import { DataTypes } from "sequelize";
import sequelize from "..";

const ProductTagMap = sequelize.define(
  "ProductTagMap",
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

    product_tag_id: {
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
    tableName: "product_tag_maps",
    timestamps: false,
    underscored: true,
  },
);

export default ProductTagMap;
