import { DataTypes } from "sequelize";
import sequelize from "../../../config/database";
import slugify from "slugify";

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

// Chuẩn hoá slug (giữ tiếng Việt hợp lý)
function makeBaseSlug(source: string) {
  return slugify(source, {
    lower: true,
    strict: true,   // bỏ ký tự không hợp lệ
    locale: "vi",
    trim: true,
  });
}

// Tạo slug duy nhất (thêm -1, -2... nếu đụng)
async function ensureUniqueSlug(base: string, idToExclude?: number) {
  let candidate = base || "san-pham";
  let i = 1;

  // Lặp đến khi không còn trùng (bỏ qua chính nó khi update)
  // Nếu bạn dùng MariaDB/MySQL collation không phân biệt hoa thường thì ok.
  // Nếu slug có UNIQUE index thì càng tốt.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Product.count({
      where: {
        slug: candidate,
        ...(idToExclude ? { id: { [require("sequelize").Op.ne]: idToExclude } } : {}),
      },
    });
    if (exists === 0) return candidate;
    candidate = `${base}-${i++}`;
  }
}

// Tự tạo slug trước khi tạo mới
Product.beforeCreate(async (product: any) => {
  const incoming = product.slug?.toString().trim();
  const title = product.title?.toString().trim();

  // Nếu có slug gửi lên → chuẩn hoá & unique; nếu không → sinh từ title
  const base = incoming ? makeBaseSlug(incoming) : makeBaseSlug(title || "");
  product.slug = await ensureUniqueSlug(base);
});

// Tự cập nhật slug khi đổi title (nếu client KHÔNG chủ động set slug mới)
Product.beforeUpdate(async (product: any) => {
  const changedTitle = product.changed && product.changed("title");
  const changedSlug = product.changed && product.changed("slug");

  if (changedTitle && !changedSlug) {
    const title = product.title?.toString().trim();
    const base = makeBaseSlug(title || "");
    product.slug = await ensureUniqueSlug(base, Number(product.id));
  } else if (changedSlug) {
    // Nếu client tự gửi slug mới → chuẩn hoá & unique luôn
    const base = makeBaseSlug(product.slug?.toString().trim() || "");
    product.slug = await ensureUniqueSlug(base, Number(product.id));
  }
});

export default Product;
