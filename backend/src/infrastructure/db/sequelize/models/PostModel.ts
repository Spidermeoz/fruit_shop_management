import { DataTypes, Op } from "sequelize";
import sequelize from "..";
import slugify from "slugify";

const PostModel = sequelize.define(
  "Post",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    post_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    excerpt: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    content: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    thumbnail: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "draft",
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

    published_at: {
      type: DataTypes.DATE,
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

    view_count: {
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
    tableName: "posts",
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
  let candidate = base || "bai-viet";
  let i = 1;

  while (true) {
    const exists = await PostModel.count({
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

PostModel.beforeCreate(async (row: any) => {
  const title = row.title?.toString().trim();
  const incoming = row.slug?.toString().trim();
  const base = makeBaseSlug(incoming || title || "");
  row.slug = await ensureUniqueSlug(base);

  if (row.status === "published" && !row.published_at) {
    row.published_at = new Date();
  }
});

PostModel.beforeUpdate(async (row: any) => {
  const changedTitle = row.changed && row.changed("title");
  const changedSlug = row.changed && row.changed("slug");
  const changedStatus = row.changed && row.changed("status");

  if (changedSlug) {
    const base = makeBaseSlug(row.slug?.toString().trim() || "");
    row.slug = await ensureUniqueSlug(base, Number(row.id));
  } else if (changedTitle) {
    const base = makeBaseSlug(row.title?.toString().trim() || "");
    row.slug = await ensureUniqueSlug(base, Number(row.id));
  }

  if (changedStatus && row.status === "published" && !row.published_at) {
    row.published_at = new Date();
  }
});

export default PostModel;
