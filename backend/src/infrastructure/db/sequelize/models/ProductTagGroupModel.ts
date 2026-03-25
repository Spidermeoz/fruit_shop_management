import { DataTypes, Op } from "sequelize";
import sequelize from "../index";
import slugify from "slugify";

const ProductTagGroupModel = sequelize.define(
  "ProductTagGroup",
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
      unique: true,
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
    tableName: "product_tag_groups",
    timestamps: true,
    underscored: true,
  },
);

const makeBaseSlug = (value: string) =>
  slugify(value || "", {
    lower: true,
    strict: true,
    locale: "vi",
    trim: true,
  });

const ensureUniqueSlug = async (base: string, excludeId?: number) => {
  const normalizedBase = base || "group";
  let candidate = normalizedBase;
  let counter = 1;

  while (true) {
    const where: any = { slug: candidate };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const existed = await ProductTagGroupModel.findOne({ where });
    if (!existed) return candidate;

    candidate = `${normalizedBase}-${counter++}`;
  }
};

ProductTagGroupModel.beforeValidate(async (instance: any) => {
  const rawName = instance.name?.toString().trim() || "";
  const rawSlug = instance.slug?.toString().trim() || "";

  const shouldGenerateSlug =
    !rawSlug ||
    instance.isNewRecord ||
    instance.changed("name") ||
    instance.changed("slug");

  if (!shouldGenerateSlug) return;

  const base = makeBaseSlug(rawSlug || rawName);
  instance.slug = await ensureUniqueSlug(
    base,
    instance.isNewRecord ? undefined : Number(instance.id),
  );
});

export default ProductTagGroupModel;
