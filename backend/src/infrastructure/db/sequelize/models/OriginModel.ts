import { DataTypes, Op } from "sequelize";
import sequelize from "..";
import slugify from "slugify";

const Origin = sequelize.define(
  "Origin",
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

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    country_code: {
      type: DataTypes.STRING(10),
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
    tableName: "origins",
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
  let candidate = base || "xuat-xu";
  let i = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Origin.count({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    });

    if (exists === 0) return candidate;

    candidate = `${candidate.replace(/-\d+$/, "")}-${i++}`;
  }
}

Origin.beforeValidate((origin: any) => {
  if (typeof origin.name === "string") {
    origin.name = origin.name.trim();
  }
});

Origin.beforeCreate(async (origin: any) => {
  const name = origin.name?.toString().trim() || "";
  const base = makeBaseSlug(name);
  origin.slug = await ensureUniqueSlug(base);
});

Origin.beforeUpdate(async (origin: any) => {
  const changedName = origin.changed && origin.changed("name");

  if (!changedName) return;

  const name = origin.name?.toString().trim() || "";
  const base = makeBaseSlug(name);
  origin.slug = await ensureUniqueSlug(base, Number(origin.id));
});

export default Origin;
