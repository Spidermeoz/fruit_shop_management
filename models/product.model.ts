import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    product_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    thumbnail: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
    },
    featured: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    review_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    created_by_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    updated_by_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    deleted_by_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: "products",
    timestamps: true, // Sequelize sẽ tự thêm createdAt/updatedAt
    underscored: true, // 🔁 map về created_at / updated_at (khớp DB)
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Product;
