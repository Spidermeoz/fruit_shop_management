import { DataTypes, Op } from "sequelize";
import sequelize from "..";
import slugify from "slugify";

const ProductTag = sequelize.define(
  "ProductTag",
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
      allowNull: true,
      unique: true,
    },

    tag_group: {
      type: DataTypes.STRING(50),
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
    tableName: "product_tags",
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
  let candidate = base || "tag";
  let i = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await ProductTag.count({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    });

    if (exists === 0) return candidate;

    candidate = `${candidate.replace(/-\d+$/, "")}-${i++}`;
  }
}

ProductTag.beforeCreate(async (tag: any) => {
  const name = tag.name?.toString().trim();
  const incoming = tag.slug?.toString().trim();
  const base = makeBaseSlug(incoming || name || "");
  tag.slug = await ensureUniqueSlug(base);
});

ProductTag.beforeUpdate(async (tag: any) => {
  const changedName = tag.changed && tag.changed("name");
  const changedSlug = tag.changed && tag.changed("slug");

  if (changedSlug) {
    const base = makeBaseSlug(tag.slug?.toString().trim() || "");
    tag.slug = await ensureUniqueSlug(base, Number(tag.id));
    return;
  }

  if (changedName) {
    const base = makeBaseSlug(tag.name?.toString().trim() || "");
    tag.slug = await ensureUniqueSlug(base, Number(tag.id));
  }
});

export default ProductTag;
