import { DataTypes, Model, Optional, Op } from "sequelize";
import sequelize from "../../../config/database";
import slugify from "slugify";
import Product from "./product.model";

// ==============================
// TypeScript types
// ==============================
interface ProductCategoryAttributes {
  id: number;
  title: string;
  parent_id?: number | null;
  description?: string | null;
  thumbnail?: string | null;
  status?: string;
  position?: number | null;
  slug?: string | null;
  deleted?: number;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type ProductCategoryCreationAttributes = Optional<
  ProductCategoryAttributes,
  "id" | "slug" | "deleted" | "deleted_at" | "created_at" | "updated_at"
>;

// ==============================
// Model Class
// ==============================
class ProductCategory
  extends Model<ProductCategoryAttributes, ProductCategoryCreationAttributes>
  implements ProductCategoryAttributes
{
  public id!: number;
  public title!: string;
  public parent_id!: number | null;
  public description!: string | null;
  public thumbnail!: string | null;
  public status!: string;
  public position!: number | null;
  public slug!: string | null;
  public deleted!: number;
  public deleted_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;
  public parent?: ProductCategory | null;
  public children?: ProductCategory[];
}

ProductCategory.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    description: DataTypes.TEXT,
    thumbnail: DataTypes.TEXT,
    status: {
      type: DataTypes.STRING(50),
      defaultValue: "active",
    },
    position: DataTypes.INTEGER,
    slug: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    deleted: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    deleted_at: DataTypes.DATE,
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
    tableName: "products_category",
    sequelize,
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// ==============================
// Hooks & Slug logic (giữ nguyên)
// ==============================
function makeBaseSlug(source: string) {
  return slugify(source, {
    lower: true,
    strict: true,
    locale: "vi",
    trim: true,
  });
}

async function ensureUniqueSlug(base: string, idToExclude?: number) {
  let candidate = base || "danh-muc";
  let i = 1;
  while (true) {
    const exists = await ProductCategory.count({
      where: {
        slug: candidate,
        ...(idToExclude ? { id: { [Op.ne]: idToExclude } } : {}),
      },
    });
    if (exists === 0) return candidate;
    candidate = `${base}-${i++}`;
  }
}

ProductCategory.beforeCreate(async (category) => {
  const base = makeBaseSlug(category.slug || category.title);
  category.slug = await ensureUniqueSlug(base);
});

ProductCategory.beforeUpdate(async (category) => {
  const changedTitle = category.changed?.("title");
  const changedSlug = category.changed?.("slug");
  if (changedTitle && !changedSlug) {
    const base = makeBaseSlug(category.title);
    category.slug = await ensureUniqueSlug(base, category.id);
  } else if (changedSlug) {
    const base = makeBaseSlug(category.slug || "");
    category.slug = await ensureUniqueSlug(base, category.id);
  }
});

// ==============================
// Associations
// ==============================
ProductCategory.hasMany(ProductCategory, {
  as: "children",
  foreignKey: "parent_id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

ProductCategory.belongsTo(ProductCategory, {
  as: "parent",
  foreignKey: "parent_id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Product.belongsTo(ProductCategory, {
  foreignKey: "product_category_id",
  as: "category",
});

ProductCategory.hasMany(Product, {
  foreignKey: "product_category_id",
  as: "products",
});

export default ProductCategory;
