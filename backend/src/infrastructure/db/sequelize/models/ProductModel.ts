// src/infrastructure/db/sequelize/models/ProductModel.ts
import { DataTypes, Op } from "sequelize";
import sequelize from "..";
import slugify from "slugify";

/**
 * Sequelize Model cho bảng `products`
 * (map sát schema MySQL trong ShopHoaQua.sql)
 */
const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    // FK -> products_category.id
    product_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    // Core fields
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
      allowNull: true, // 0..100 (ràng buộc ở DB)
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
      defaultValue: "active", // enum: active|inactive|draft (check ở DB)
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
      unique: true, // bổ sung unique key
    },

    // Aggregates từ reviews
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

    // Auditing
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

    // Soft delete
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Timestamps
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
    timestamps: true,
    underscored: true, // created_at, updated_at
    paranoid: false,   // ta tự quản deleted/deleted_at
  }
);

// === Helpers sinh/đảm bảo slug duy nhất ===
function makeBaseSlug(source: string) {
  return slugify(source || "", {
    lower: true,
    strict: true,
    locale: "vi",
    trim: true,
  });
}

async function ensureUniqueSlug(base: string, excludeId?: number) {
  let candidate = base || "san-pham";
  let i = 1;
  // lặp đến khi không trùng slug
  // bỏ qua chính nó khi update (excludeId)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Product.count({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    });
    if (exists === 0) return candidate;
    candidate = `${candidate.replace(/-\d+$/, "")}-${i++}`;
  }
}

// — Hook: tạo slug khi create (nếu không truyền hoặc truyền sai định dạng)
Product.beforeCreate(async (product: any) => {
  const title = product.title?.toString().trim();
  const incoming = product.slug?.toString().trim();
  const base = makeBaseSlug(incoming || title || "");
  product.slug = await ensureUniqueSlug(base);
});

// — Hook: update slug nếu đổi title mà KHÔNG chủ động set slug
Product.beforeUpdate(async (product: any) => {
  const changedTitle = product.changed && product.changed("title");
  const changedSlug = product.changed && product.changed("slug");

  if (changedSlug) {
    const base = makeBaseSlug(product.slug?.toString().trim() || "");
    product.slug = await ensureUniqueSlug(base, Number(product.id));
    return;
  }
  if (changedTitle) {
    const base = makeBaseSlug(product.title?.toString().trim() || "");
    product.slug = await ensureUniqueSlug(base, Number(product.id));
  }
});

export default Product;

// Gợi ý: ở models/index.ts bạn có thể define association như:
// Product.belongsTo(ProductCategory, { as: 'category', foreignKey: 'product_category_id' });
