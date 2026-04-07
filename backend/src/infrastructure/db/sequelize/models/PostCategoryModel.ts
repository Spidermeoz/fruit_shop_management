import { DataTypes, Op } from "sequelize";
import sequelize from "..";
import slugify from "slugify";

const PostCategoryModel = sequelize.define(
  "PostCategory",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    parent_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
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
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
    },

    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    seo_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    seo_description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    seo_keywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    og_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    canonical_url: {
      type: DataTypes.STRING(500),
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
    tableName: "post_categories",
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
);

function makeBaseSlug(source: string) {
  return slugify(source || "", {
    lower: true,
    strict: true,
    locale: "vi",
    trim: true,
  });
}

async function ensureUniqueSlug(base: string, excludeId?: number) {
  let candidate = base || "danh-muc-bai-viet";
  let i = 1;

  while (true) {
    const exists = await PostCategoryModel.count({
      where: {
        slug: candidate,
        deleted: 0,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    });

    if (exists === 0) return candidate;
    candidate = `${candidate.replace(/-\d+$/, "")}-${i++}`;
  }
}

PostCategoryModel.beforeCreate(async (row: any) => {
  const title = row.title?.toString().trim();
  const incoming = row.slug?.toString().trim();
  const base = makeBaseSlug(incoming || title || "");
  row.slug = await ensureUniqueSlug(base);
});

PostCategoryModel.beforeUpdate(async (row: any) => {
  const changedTitle = row.changed && row.changed("title");
  const changedSlug = row.changed && row.changed("slug");

  if (changedSlug) {
    const base = makeBaseSlug(row.slug?.toString().trim() || "");
    row.slug = await ensureUniqueSlug(base, Number(row.id));
    return;
  }

  if (changedTitle) {
    const base = makeBaseSlug(row.title?.toString().trim() || "");
    row.slug = await ensureUniqueSlug(base, Number(row.id));
  }
});

export default PostCategoryModel;
