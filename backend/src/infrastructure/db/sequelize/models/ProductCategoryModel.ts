// src/infrastructure/db/sequelize/models/ProductCategoryModel.ts
import { DataTypes, Op } from "sequelize";
import sequelize from ".."; // <- dùng instance đã tạo ở src/infrastructure/db/sequelize/index.ts
import slugify from "slugify";

/**
 * Sequelize Model cho bảng `product_categories`
 * (map theo code MVC hiện tại của bạn)
 */
const ProductCategory = sequelize.define(
  "ProductCategory",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    // Cha của danh mục
    parent_id: {
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

    thumbnail: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING(50), // 'active' | 'inactive'
      allowNull: false,
      defaultValue: "active",
    },

    // vị trí sắp xếp trong phạm vi cùng parent
    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },

    // Soft delete flags
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // timestamps
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
    tableName: "products_category",
    timestamps: true,
    underscored: true,
    paranoid: false,
  }
);

// ===== Helpers: tạo slug duy nhất =====
function makeBaseSlug(source: string) {
  return slugify(source || "", {
    lower: true,
    strict: true,
    locale: "vi",
    trim: true,
  });
}

async function ensureUniqueSlug(base: string, excludeId?: number) {
  let candidate = base || "danh-muc";
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await ProductCategory.count({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    });
    if (exists === 0) return candidate;
    candidate = `${candidate.replace(/-\d+$/, "")}-${i++}`;
  }
}

// Tạo slug khi create nếu thiếu
ProductCategory.beforeCreate(async (row: any) => {
  const incoming = row.slug?.toString().trim();
  const title = row.title?.toString().trim();
  const base = makeBaseSlug(incoming || title || "");
  row.slug = await ensureUniqueSlug(base);
});

// ✅ Guard cho BULK UPDATE: chỉ ép chạy theo từng bản ghi nếu có đụng 'title' hoặc 'slug'
ProductCategory.beforeBulkUpdate((options: any) => {
  // Sequelize có thể truyền fields hoặc attributes tuỳ phiên bản
  const fields: string[] = Array.isArray(options?.fields)
    ? options.fields
    : options?.attributes
    ? Object.keys(options.attributes)
    : [];
  const touchesTitleOrSlug =
    fields.includes("title") || fields.includes("slug");

  if (!touchesTitleOrSlug) {
    // bulk update không động tới title/slug → KHÔNG can thiệp
    return;
  }
  // Nếu có đổi title/slug trong bulk → chạy theo từng row để beforeUpdate có instance
  options.individualHooks = true;
});

// Cập nhật slug khi đổi title (hoặc tự set slug)
ProductCategory.beforeUpdate(async (row: any) => {
  const hasChanged = typeof row.changed === "function";
  const changedTitle = hasChanged ? row.changed("title") : false;
  const changedSlug = hasChanged ? row.changed("slug") : false;

  if (changedSlug) {
    const base = makeBaseSlug((row.slug ?? "").toString().trim());
    row.slug = await ensureUniqueSlug(base, Number(row.id));
    return;
  }

  if (changedTitle) {
    const base = makeBaseSlug((row.title ?? "").toString().trim());
    row.slug = await ensureUniqueSlug(base, Number(row.id));
  }
});

export default ProductCategory;
