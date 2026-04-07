import { DataTypes, Op } from "sequelize";
import sequelize from "..";
import slugify from "slugify";

const PostTagModel = sequelize.define(
  "PostTag",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    description: {
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
      allowNull: false,
      defaultValue: 0,
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
    tableName: "post_tags",
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
  let candidate = base || "the-bai-viet";
  let i = 1;

  while (true) {
    const exists = await PostTagModel.count({
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

PostTagModel.beforeValidate(async (row: any) => {
  const name = row.name?.toString().trim();
  const incoming = row.slug?.toString().trim();

  if (!incoming && name) {
    row.slug = makeBaseSlug(name);
  }
});

PostTagModel.beforeCreate(async (row: any) => {
  const name = row.name?.toString().trim();
  const incoming = row.slug?.toString().trim();
  const base = makeBaseSlug(incoming || name || "");
  row.slug = await ensureUniqueSlug(base);
});

PostTagModel.beforeUpdate(async (row: any) => {
  const changedName = row.changed && row.changed("name");
  const changedSlug = row.changed && row.changed("slug");

  if (changedSlug) {
    const base = makeBaseSlug(row.slug?.toString().trim() || "");
    row.slug = await ensureUniqueSlug(base, Number(row.id));
    return;
  }

  if (changedName) {
    const base = makeBaseSlug(row.name?.toString().trim() || "");
    row.slug = await ensureUniqueSlug(base, Number(row.id));
  }
});

export default PostTagModel;
