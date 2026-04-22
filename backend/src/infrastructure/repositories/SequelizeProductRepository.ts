import { Op, WhereOptions, literal } from "sequelize";
import { Product as DomainProduct } from "../../domain/products/Products";
import type {
  CreateProductInput,
  ProductRepository,
  UpdateProductPatch,
} from "../../domain/products/ProductRepository";
import type {
  ProductListFilter,
  ProductStatus,
} from "../../domain/products/types";

type Models = {
  Product: any;
  ProductVariant?: any;
  ProductOption?: any;
  ProductOptionValue?: any;
  ProductVariantValue?: any;
  ProductCategory?: any;
  Origin?: any;
  ProductTag?: any;
  ProductTagGroup?: any;
  ProductTagMap?: any;
  InventoryStock?: any;
};

type OptionValueRef = {
  id: number;
  value: string;
  optionId?: number;
  optionName?: string;
  position?: number;
};

export class SequelizeProductRepository implements ProductRepository {
  constructor(private models: Models) {}

  private toPlain(row: any) {
    if (!row) return row;
    return typeof row.get === "function" ? row.get({ plain: true }) : row;
  }

  private mapVariant = (row: any) => {
    const r = this.toPlain(row);

    const optionValues: OptionValueRef[] = Array.isArray(r.variantValues)
      ? r.variantValues
          .map((vv: any) => {
            const ov = vv?.optionValue;
            if (!ov) return null;

            const option = ov.option ?? null;

            return {
              id: Number(ov.id),
              value: String(ov.value ?? ""),
              optionId:
                ov.product_option_id !== undefined &&
                ov.product_option_id !== null
                  ? Number(ov.product_option_id)
                  : option?.id != null
                    ? Number(option.id)
                    : undefined,
              optionName: option?.name ?? option?.title ?? undefined,
              position:
                ov.position !== undefined && ov.position !== null
                  ? Number(ov.position)
                  : undefined,
            };
          })
          .filter(Boolean)
      : [];

    const inventoryStocks = Array.isArray(r.inventoryStocks)
      ? r.inventoryStocks.map((stock: any) => ({
          id:
            stock.id !== undefined && stock.id !== null
              ? Number(stock.id)
              : undefined,
          branchId: Number(stock.branch_id),
          quantity: Number(stock.quantity ?? 0),
          reservedQuantity: Number(stock.reserved_quantity ?? 0),
          availableQuantity: Math.max(
            0,
            Number(stock.quantity ?? 0) - Number(stock.reserved_quantity ?? 0),
          ),
          createdAt: stock.created_at,
          updatedAt: stock.updated_at,
        }))
      : [];

    const totalQuantity = inventoryStocks.reduce(
      (sum: number, stock: any) => sum + Number(stock.quantity ?? 0),
      0,
    );

    const totalReservedQuantity = inventoryStocks.reduce(
      (sum: number, stock: any) => sum + Number(stock.reservedQuantity ?? 0),
      0,
    );

    const availableQuantity = Math.max(
      0,
      totalQuantity - totalReservedQuantity,
    );

    return {
      id: Number(r.id),
      productId:
        r.product_id !== undefined && r.product_id !== null
          ? Number(r.product_id)
          : undefined,
      sku: r.sku ?? null,
      title: r.title ?? null,
      price: Number(r.price ?? 0),
      compareAtPrice:
        r.compare_at_price !== undefined && r.compare_at_price !== null
          ? Number(r.compare_at_price)
          : null,

      stock: Number(r.stock ?? availableQuantity ?? 0),
      availableStock: availableQuantity,
      reservedQuantity: totalReservedQuantity,
      inventory: {
        totalQuantity,
        totalReservedQuantity,
        availableQuantity,
        stocks: inventoryStocks,
      },

      status: r.status ?? "active",
      sortOrder: Number(r.sort_order ?? 0),
      optionValueIds: optionValues.map((x) => x.id),
      optionValues,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
    };
  };

  private mapOption = (row: any) => {
    const r = this.toPlain(row);

    return {
      id: Number(r.id),
      name: r.name ?? r.title ?? "",
      position: Number(r.position ?? 0),
      values: Array.isArray(r.values)
        ? r.values.map((v: any) => {
            const vv = this.toPlain(v);
            return {
              id: Number(vv.id),
              value: String(vv.value ?? ""),
              position: Number(vv.position ?? 0),
            };
          })
        : [],
    };
  };

  private mapRow = (row: any): DomainProduct => {
    const r = this.toPlain(row);

    const variants = Array.isArray(r.variants)
      ? r.variants.map(this.mapVariant)
      : [];

    const options = Array.isArray(r.options)
      ? r.options.map(this.mapOption)
      : [];

    const activeVariants = variants.filter((v: any) => v.status === "active");
    const priceSource = activeVariants.length ? activeVariants : variants;

    const derivedMinPrice = priceSource.length
      ? Math.min(...priceSource.map((v: any) => Number(v.price ?? 0)))
      : null;

    const derivedMaxPrice = priceSource.length
      ? Math.max(...priceSource.map((v: any) => Number(v.price ?? 0)))
      : null;

    const hasVariants = variants.length > 0;

    const derivedTotalStock = hasVariants
      ? variants.reduce(
          (
            sum: number,
            v: { stock?: number | null; availableStock?: number | null },
          ) => sum + Number(v.availableStock ?? v.stock ?? 0),
          0,
        )
      : Number(r.stock ?? 0);

    const activeInStockVariant = variants.find(
      (v: any) =>
        v.status === "active" && Number(v.availableStock ?? v.stock ?? 0) > 0,
    );

    const activeVariant = variants.find((v: any) => v.status === "active");

    const defaultVariantId =
      activeInStockVariant?.id ?? activeVariant?.id ?? variants[0]?.id ?? null;

    return DomainProduct.create({
      id: Number(r.id),
      categoryId:
        r.product_category_id !== undefined && r.product_category_id !== null
          ? Number(r.product_category_id)
          : null,
      category: r.category
        ? {
            id: Number(r.category.id),
            title: r.category.title,
          }
        : null,
      title: r.title,
      description: r.description ?? null,

      originId:
        r.origin_id !== undefined && r.origin_id !== null
          ? Number(r.origin_id)
          : null,
      shortDescription: r.short_description ?? null,
      storageGuide: r.storage_guide ?? null,
      usageSuggestions: r.usage_suggestions ?? null,
      nutritionNotes: r.nutrition_notes ?? null,

      origin: r.origin
        ? {
            id: Number(r.origin.id),
            name: r.origin.name,
            slug: r.origin.slug,
          }
        : null,

      tags: Array.isArray(r.tags)
        ? r.tags.map((t: any) => ({
            id: Number(t.id),
            name: String(t.name ?? ""),
            slug: String(t.slug ?? ""),
            productTagGroupId:
              t.product_tag_group_id != null
                ? Number(t.product_tag_group_id)
                : null,
            group: t.group
              ? {
                  id: Number(t.group.id),
                  name: String(t.group.name ?? ""),
                  slug: t.group.slug ?? null,
                }
              : null,
          }))
        : [],

      price:
        r.price !== undefined && r.price !== null
          ? Number(r.price)
          : derivedMinPrice,
      stock:
        r.stock !== undefined && r.stock !== null
          ? Number(r.stock)
          : derivedTotalStock,

      thumbnail: r.thumbnail ?? null,
      slug: r.slug ?? null,
      status: r.status as ProductStatus,
      featured: !!r.featured,
      position:
        r.position !== undefined && r.position !== null
          ? Number(r.position)
          : null,

      averageRating:
        r.average_rating !== undefined && r.average_rating !== null
          ? Number(r.average_rating)
          : 0,
      reviewCount: Number(r.review_count ?? 0),

      deleted: !!r.deleted,
      deletedAt: r.deleted_at ?? null,

      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
      createdById:
        r.created_by_id !== undefined && r.created_by_id !== null
          ? Number(r.created_by_id)
          : null,
      updatedById:
        r.updated_by_id !== undefined && r.updated_by_id !== null
          ? Number(r.updated_by_id)
          : null,

      variants,
      options,
      defaultVariantId,
      priceRange:
        derivedMinPrice !== null && derivedMaxPrice !== null
          ? {
              minPrice: derivedMinPrice,
              maxPrice: derivedMaxPrice,
            }
          : null,
      totalStock: derivedTotalStock,
    });
  };

  private buildIncludes(includeOptions = true) {
    const includes: any[] = [];

    if (this.models.ProductCategory) {
      includes.push({
        model: this.models.ProductCategory,
        as: "category",
        attributes: ["id", "title"],
      });
    }

    if (this.models.ProductVariant) {
      const variantInclude: any[] = [];

      if (this.models.InventoryStock) {
        variantInclude.push({
          model: this.models.InventoryStock,
          as: "inventoryStocks",
          attributes: [
            "id",
            "branch_id",
            "quantity",
            "reserved_quantity",
            "created_at",
            "updated_at",
          ],
          required: false,
        });
      }

      if (this.models.ProductVariantValue && this.models.ProductOptionValue) {
        const optionValueInclude: any = {
          model: this.models.ProductOptionValue,
          as: "optionValue",
          attributes: ["id", "product_option_id", "value", "position"],
        };

        if (this.models.ProductOption) {
          optionValueInclude.include = [
            {
              model: this.models.ProductOption,
              as: "option",
              attributes: ["id", "name", "position"],
            },
          ];
        }

        variantInclude.push({
          model: this.models.ProductVariantValue,
          as: "variantValues",
          attributes: ["id", "product_variant_id", "product_option_value_id"],
          include: [optionValueInclude],
          required: false,
        });
      }

      includes.push({
        model: this.models.ProductVariant,
        as: "variants",
        attributes: [
          "id",
          "product_id",
          "sku",
          "title",
          "price",
          "compare_at_price",
          "stock",
          "status",
          "sort_order",
          "created_at",
          "updated_at",
        ],
        required: false,
        include: variantInclude,
      });
    }

    if (
      includeOptions &&
      this.models.ProductOption &&
      this.models.ProductOptionValue
    ) {
      includes.push({
        model: this.models.ProductOption,
        as: "options",
        attributes: ["id", "product_id", "name", "position"],
        required: false,
        include: [
          {
            model: this.models.ProductOptionValue,
            as: "values",
            attributes: ["id", "product_option_id", "value", "position"],
            required: false,
          },
        ],
      });
    }

    if (this.models.Origin) {
      includes.push({
        model: this.models.Origin,
        as: "origin",
        attributes: ["id", "name", "slug"],
      });
    }

    if (this.models.ProductTag && this.models.ProductTagMap) {
      includes.push({
        model: this.models.ProductTag,
        as: "tags",
        attributes: ["id", "name", "slug", "product_tag_group_id"],
        through: { attributes: [] },
        required: false,
        include: this.models.ProductTagGroup
          ? [
              {
                model: this.models.ProductTagGroup,
                as: "group",
                attributes: ["id", "name", "slug"],
                required: false,
              },
            ]
          : [],
      });
    }

    return includes;
  }

  private normalizeVariantInput(variant: any, index: number) {
    return {
      sku: variant?.sku ?? null,
      title: variant?.title ?? null,
      price: Number(variant?.price ?? 0),
      compare_at_price:
        variant?.compareAtPrice !== undefined &&
        variant?.compareAtPrice !== null
          ? Number(variant.compareAtPrice)
          : variant?.compare_at_price !== undefined &&
              variant?.compare_at_price !== null
            ? Number(variant.compare_at_price)
            : null,
      status: variant?.status ?? "active",
      sort_order: Number(variant?.sortOrder ?? variant?.sort_order ?? index),
      optionValueIds: Array.isArray(variant?.optionValueIds)
        ? variant.optionValueIds.map((x: any) => Number(x))
        : [],
      optionValues: Array.isArray(variant?.optionValues)
        ? variant.optionValues
        : [],
    };
  }

  private computeFallbackFields(input: {
    price?: number | null;
    stock?: number | null;
    variants?: any[];
  }) {
    const variants = Array.isArray(input.variants)
      ? input.variants.map((v, index) => this.normalizeVariantInput(v, index))
      : [];

    if (!variants.length) {
      return {
        price:
          input.price !== undefined && input.price !== null
            ? Number(input.price)
            : null,
        stock: Number(input.stock ?? 0),
        normalizedVariants: variants,
      };
    }

    return {
      price: Math.min(...variants.map((v: any) => Number(v.price ?? 0))),
      stock: variants.reduce(
        (sum: number, v: any) => sum + Number(v.stock ?? 0),
        0,
      ),
      normalizedVariants: variants,
    };
  }

  private async resolvePosition(input: {
    categoryId?: number | null;
    position?: number | null;
  }) {
    let position = input.position ?? null;

    if (position != null) return Number(position);

    const normalizedCategoryId =
      input.categoryId && Number(input.categoryId) > 0
        ? Number(input.categoryId)
        : null;

    const where: any = {
      product_category_id: normalizedCategoryId,
      deleted: 0,
    };

    let maxPos = await this.models.Product.max("position", { where });
    maxPos = Number(maxPos) || 0;

    return maxPos + 1;
  }

  private async syncProductTags(
    productId: number,
    tagIds: number[],
    transaction?: any,
  ) {
    const ProductTagMap = this.models.ProductTagMap;
    if (!ProductTagMap) return;

    await ProductTagMap.destroy({
      where: { product_id: productId },
      transaction,
    });

    if (!tagIds.length) return;

    await ProductTagMap.bulkCreate(
      tagIds.map((tagId) => ({
        product_id: productId,
        product_tag_id: tagId,
      })),
      { transaction },
    );
  }

  private async syncOptionsAndVariants(
    productId: number,
    payload: {
      options?: any[];
      variants?: any[];
    },
    transaction?: any,
  ) {
    const Option = this.models.ProductOption;
    const OptionValue = this.models.ProductOptionValue;
    const Variant = this.models.ProductVariant;
    const VariantValue = this.models.ProductVariantValue;

    const hasOptions = !!Option && !!OptionValue;
    const hasVariants = !!Variant;
    const hasVariantValues = !!VariantValue;

    const optionsInput = Array.isArray(payload.options) ? payload.options : [];
    const variantsInput = Array.isArray(payload.variants)
      ? payload.variants
      : [];

    if (hasVariantValues && hasVariants) {
      const oldVariants = await Variant.findAll({
        where: { product_id: productId },
        attributes: ["id"],
        transaction,
      });

      const oldVariantIds = oldVariants.map((v: any) => Number(v.id));

      if (oldVariantIds.length) {
        await VariantValue.destroy({
          where: { product_variant_id: { [Op.in]: oldVariantIds } },
          transaction,
        });
      }
    }

    if (hasVariants) {
      await Variant.destroy({
        where: { product_id: productId },
        transaction,
      });
    }

    if (hasOptions) {
      const oldOptions = await Option.findAll({
        where: { product_id: productId },
        attributes: ["id"],
        transaction,
      });

      const oldOptionIds = oldOptions.map((o: any) => Number(o.id));

      if (oldOptionIds.length) {
        await OptionValue.destroy({
          where: { product_option_id: { [Op.in]: oldOptionIds } },
          transaction,
        });
      }

      await Option.destroy({
        where: { product_id: productId },
        transaction,
      });
    }

    const optionValueIdMap = new Map<string, number>();

    if (hasOptions && optionsInput.length) {
      for (
        let optionIndex = 0;
        optionIndex < optionsInput.length;
        optionIndex += 1
      ) {
        const optionInput = optionsInput[optionIndex];

        const optionRow = await Option.create(
          {
            product_id: productId,
            name: optionInput?.name ?? optionInput?.title ?? "",
            position: Number(optionInput?.position ?? optionIndex),
          },
          { transaction },
        );

        const optionId = Number(optionRow.id);
        const values = Array.isArray(optionInput?.values)
          ? optionInput.values
          : [];

        for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
          const valueInput = values[valueIndex];

          const valueRow = await OptionValue.create(
            {
              product_option_id: optionId,
              value: valueInput?.value ?? "",
              position: Number(valueInput?.position ?? valueIndex),
            },
            { transaction },
          );

          const createdValueId = Number(valueRow.id);

          if (valueInput?.id !== undefined && valueInput?.id !== null) {
            optionValueIdMap.set(
              `legacy:${Number(valueInput.id)}`,
              createdValueId,
            );
          }

          optionValueIdMap.set(
            `pair:${String(optionInput?.name ?? optionInput?.title ?? "")
              .trim()
              .toLowerCase()}::${String(valueInput?.value ?? "")
              .trim()
              .toLowerCase()}`,
            createdValueId,
          );
        }
      }
    }

    if (hasVariants && variantsInput.length) {
      for (let index = 0; index < variantsInput.length; index += 1) {
        const normalized = this.normalizeVariantInput(
          variantsInput[index],
          index,
        );

        const variantRow = await Variant.create(
          {
            product_id: productId,
            sku: normalized.sku,
            title: normalized.title,
            price: normalized.price,
            compare_at_price: normalized.compare_at_price,
            stock: 0,
            status: normalized.status,
            sort_order: normalized.sort_order,
          },
          { transaction },
        );

        if (hasVariantValues) {
          const resolvedValueIds = new Set<number>();

          for (const id of normalized.optionValueIds) {
            if (!Number.isFinite(Number(id)) || Number(id) <= 0) continue;

            const mapped = optionValueIdMap.get(`legacy:${Number(id)}`);
            if (mapped && Number(mapped) > 0) {
              resolvedValueIds.add(Number(mapped));
            }
          }

          for (const ov of normalized.optionValues) {
            const optionName = String(ov?.optionName ?? "").trim();
            const optionValue = String(ov?.value ?? "").trim();

            if (!optionName || !optionValue) continue;

            const key = `pair:${optionName.toLowerCase()}::${optionValue.toLowerCase()}`;
            const mapped = optionValueIdMap.get(key);

            if (mapped && Number(mapped) > 0) {
              resolvedValueIds.add(Number(mapped));
            }
          }

          for (const optionValueId of resolvedValueIds) {
            if (
              !Number.isFinite(Number(optionValueId)) ||
              Number(optionValueId) <= 0
            ) {
              continue;
            }

            await VariantValue.create(
              {
                product_variant_id: variantRow.id,
                product_option_value_id: optionValueId,
              },
              { transaction },
            );
          }
        }
      }
    }
  }

  async list(filter: ProductListFilter) {
    const {
      page = 1,
      limit = 10,
      q,
      categoryId = null,
      status = "all",
      featured,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      stockStatus = "all",
      missingThumbnail,
      hasPendingReviews,
      lowStockThreshold = 10,
      sortBy = "id",
      order = "DESC",
    } = filter;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const safeOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (safePage - 1) * safeLimit;

    const whereParts: string[] = [`p.deleted = 0`];
    const replacements: Record<string, any> = {
      limit: safeLimit,
      offset,
      lowStockThreshold: Number(lowStockThreshold || 10),
    };

    if (categoryId !== null) {
      if (Array.isArray(categoryId)) {
        whereParts.push(`p.product_category_id IN (:categoryIds)`);
        replacements.categoryIds = categoryId.map(Number);
      } else {
        whereParts.push(`p.product_category_id = :categoryId`);
        replacements.categoryId = Number(categoryId);
      }
    }

    if (status !== "all") {
      whereParts.push(`p.status = :status`);
      replacements.status = status;
    }

    if (typeof featured === "boolean") {
      whereParts.push(`p.featured = :featured`);
      replacements.featured = featured ? 1 : 0;
    }

    if (typeof missingThumbnail === "boolean") {
      if (missingThumbnail) {
        whereParts.push(`(p.thumbnail IS NULL OR TRIM(p.thumbnail) = '')`);
      } else {
        whereParts.push(
          `(p.thumbnail IS NOT NULL AND TRIM(p.thumbnail) <> '')`,
        );
      }
    }

    if (q && String(q).trim()) {
      whereParts.push(`(p.title LIKE :q OR p.slug LIKE :q)`);
      replacements.q = `%${String(q).trim()}%`;
    }

    const baseDataset = `
    SELECT
      p.id,
      p.status,
      p.thumbnail,
      COALESCE(
        (
          SELECT MIN(pv.price)
          FROM product_variants pv
          WHERE pv.product_id = p.id AND pv.status = 'active'
        ),
        p.price,
        0
      ) AS effective_min_price,
      COALESCE(
        (
          SELECT MAX(pv.price)
          FROM product_variants pv
          WHERE pv.product_id = p.id AND pv.status = 'active'
        ),
        p.price,
        0
      ) AS effective_max_price,
      COALESCE(
        (
          SELECT SUM(GREATEST(0, COALESCE(s.quantity, pv.stock, 0) - COALESCE(s.reserved_quantity, 0)))
          FROM product_variants pv
          LEFT JOIN inventory_stocks s ON s.product_variant_id = pv.id
          WHERE pv.product_id = p.id
        ),
        p.stock,
        0
      ) AS effective_stock,
      COALESCE(
        (
          SELECT COUNT(pr.id)
          FROM product_reviews pr
          WHERE pr.product_id = p.id
            AND pr.parent_id IS NULL
            AND pr.status = 'approved'
            AND NOT EXISTS (
              SELECT 1
              FROM product_reviews child
              WHERE child.parent_id = pr.id
            )
        ),
        0
      ) AS pending_review_count
    FROM products p
    WHERE ${whereParts.join(" AND ")}
  `;

    const outerWhere: string[] = [`1=1`];

    if (minPrice != null) {
      outerWhere.push(`base.effective_max_price >= :minPrice`);
      replacements.minPrice = Number(minPrice);
    }

    if (maxPrice != null) {
      outerWhere.push(`base.effective_min_price <= :maxPrice`);
      replacements.maxPrice = Number(maxPrice);
    }

    if (minStock != null) {
      outerWhere.push(`base.effective_stock >= :minStock`);
      replacements.minStock = Number(minStock);
    }

    if (maxStock != null) {
      outerWhere.push(`base.effective_stock <= :maxStock`);
      replacements.maxStock = Number(maxStock);
    }

    if (stockStatus === "out_of_stock") {
      outerWhere.push(`base.effective_stock <= 0`);
    } else if (stockStatus === "low_stock") {
      outerWhere.push(
        `base.effective_stock > 0 AND base.effective_stock <= :lowStockThreshold`,
      );
    } else if (stockStatus === "in_stock") {
      outerWhere.push(`base.effective_stock > :lowStockThreshold`);
    }

    if (typeof hasPendingReviews === "boolean") {
      outerWhere.push(
        hasPendingReviews
          ? `base.pending_review_count > 0`
          : `base.pending_review_count = 0`,
      );
    }

    const sortMap: Record<string, string> = {
      id: "base.id",
      title: "base.id", // giữ an toàn nếu chưa join title ra outer dataset
      price: "base.effective_min_price",
      stock: "base.effective_stock",
      position: "base.id",
      average_rating: "base.id",
      review_count: "base.id",
      createdAt: "base.id",
      updatedAt: "base.id",
      slug: "base.id",
    };

    const sortExpr = sortMap[sortBy] || "base.id";

    const sequelize = this.models.Product.sequelize as any;

    const [countRows] = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (${baseDataset}) base
      WHERE ${outerWhere.join(" AND ")}
    `,
      { replacements },
    );

    const count = Number((countRows as any[])[0]?.total ?? 0);

    const [idRows] = await sequelize.query(
      `
      SELECT base.id
      FROM (${baseDataset}) base
      WHERE ${outerWhere.join(" AND ")}
      ORDER BY ${sortExpr} ${safeOrder}, base.id DESC
      LIMIT :limit OFFSET :offset
    `,
      { replacements },
    );

    const ids = (idRows as any[]).map((r) => Number(r.id));

    const [summaryRows] = await sequelize.query(
      `
      SELECT
        COUNT(*) AS totalItems,
        SUM(CASE WHEN base.status = 'active' THEN 1 ELSE 0 END) AS activeCount,
        SUM(CASE WHEN base.status <> 'active' THEN 1 ELSE 0 END) AS inactiveCount,
        SUM(CASE WHEN base.effective_stock <= 0 THEN 1 ELSE 0 END) AS outOfStockCount,
        SUM(CASE WHEN base.effective_stock > 0 AND base.effective_stock <= :lowStockThreshold THEN 1 ELSE 0 END) AS lowStockCount,
        SUM(CASE WHEN base.thumbnail IS NULL OR TRIM(base.thumbnail) = '' THEN 1 ELSE 0 END) AS missingThumbnailCount,
        SUM(base.pending_review_count) AS pendingReviewCount,
        SUM(CASE WHEN base.pending_review_count > 0 THEN 1 ELSE 0 END) AS productsWithPendingReviewCount
      FROM (${baseDataset}) base
      WHERE ${outerWhere.join(" AND ")}
    `,
      { replacements },
    );

    const summary = {
      totalItems: Number((summaryRows as any[])[0]?.totalItems ?? 0),
      activeCount: Number((summaryRows as any[])[0]?.activeCount ?? 0),
      inactiveCount: Number((summaryRows as any[])[0]?.inactiveCount ?? 0),
      outOfStockCount: Number((summaryRows as any[])[0]?.outOfStockCount ?? 0),
      lowStockCount: Number((summaryRows as any[])[0]?.lowStockCount ?? 0),
      missingThumbnailCount: Number(
        (summaryRows as any[])[0]?.missingThumbnailCount ?? 0,
      ),
      pendingReviewCount: Number(
        (summaryRows as any[])[0]?.pendingReviewCount ?? 0,
      ),
      productsWithPendingReviewCount: Number(
        (summaryRows as any[])[0]?.productsWithPendingReviewCount ?? 0,
      ),
    };

    if (!ids.length) {
      return { rows: [], count, summary };
    }

    const preserveOrderLiteral = literal(`FIELD(Product.id, ${ids.join(",")})`);

    const rows = await this.models.Product.findAll({
      where: {
        id: { [Op.in]: ids },
        deleted: 0,
      },
      include: this.buildIncludes(false),
      distinct: true,
      subQuery: false,
      order: [[preserveOrderLiteral, "ASC"]],
    });

    return { rows: rows.map(this.mapRow), count, summary };
  }

  async findById(id: number) {
    const row = await this.models.Product.findOne({
      where: { id, deleted: 0 },
      include: this.buildIncludes(true),
      subQuery: false,
    });

    return row ? this.mapRow(row) : null;
  }

  async findBySlug(slug: string) {
    const row = await this.models.Product.findOne({
      where: { slug, deleted: 0 },
      include: this.buildIncludes(true),
      subQuery: false,
    });

    return row ? this.mapRow(row) : null;
  }

  async create(input: CreateProductInput & { tagIds?: number[] }) {
    const transaction = await this.models.Product.sequelize.transaction();

    try {
      const position = await this.resolvePosition(input);
      const { price, stock, normalizedVariants } = this.computeFallbackFields({
        price: input.price ?? null,
        variants: input.variants,
      });

      const row = await this.models.Product.create(
        {
          product_category_id: input.categoryId ?? null,
          title: input.title,
          description: input.description ?? null,
          price,
          stock,
          thumbnail: input.thumbnail ?? null,
          slug: input.slug ?? null,
          status: input.status ?? "active",
          featured: !!input.featured,
          position,
          deleted: 0,
          deleted_at: null,
          origin_id: input.originId ?? null,
          short_description: input.shortDescription ?? null,
          storage_guide: input.storageGuide ?? null,
          usage_suggestions: input.usageSuggestions ?? null,
          nutrition_notes: input.nutritionNotes ?? null,
        },
        { transaction },
      );

      await this.syncProductTags(
        Number(row.id),
        input.tagIds ?? [],
        transaction,
      );

      await this.syncOptionsAndVariants(
        Number(row.id),
        {
          options: input.options,
          variants: normalizedVariants,
        },
        transaction,
      );

      await transaction.commit();

      const fresh = await this.findById(Number(row.id));
      if (!fresh) throw new Error("Product not found after create");
      return fresh;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: number, patch: UpdateProductPatch & { tagIds?: number[] }) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Product not found");
    }

    const transaction = await this.models.Product.sequelize.transaction();

    try {
      const merged = {
        ...existing.props,
        ...patch,
      };

      const nextVariants =
        patch.variants !== undefined ? patch.variants : existing.props.variants;

      const { price, stock, normalizedVariants } = this.computeFallbackFields({
        price:
          patch.price !== undefined
            ? patch.price
            : (existing.props.price ?? null),
        variants: nextVariants,
      });

      const updateData: any = {
        title: merged.title,
        description: merged.description ?? null,
        price,
        stock,
        thumbnail: merged.thumbnail ?? null,
        slug: merged.slug ?? null,
        status: merged.status,
        featured: !!merged.featured,
      };

      if (patch.position !== undefined) {
        updateData.position = patch.position;
      }

      if (patch.categoryId !== undefined) {
        updateData.product_category_id = patch.categoryId;
      }

      if (patch.originId !== undefined) {
        updateData.origin_id = patch.originId;
      }
      if (patch.shortDescription !== undefined) {
        updateData.short_description = patch.shortDescription;
      }
      if (patch.storageGuide !== undefined) {
        updateData.storage_guide = patch.storageGuide;
      }
      if (patch.usageSuggestions !== undefined) {
        updateData.usage_suggestions = patch.usageSuggestions;
      }
      if (patch.nutritionNotes !== undefined) {
        updateData.nutrition_notes = patch.nutritionNotes;
      }

      await this.models.Product.update(updateData, {
        where: { id },
        transaction,
      });

      if (patch.tagIds !== undefined) {
        await this.syncProductTags(id, patch.tagIds ?? [], transaction);
      }

      if (patch.options !== undefined || patch.variants !== undefined) {
        await this.syncOptionsAndVariants(
          id,
          {
            options:
              patch.options !== undefined
                ? patch.options
                : existing.props.options,
            variants:
              patch.variants !== undefined
                ? normalizedVariants
                : existing.props.variants,
          },
          transaction,
        );
      }

      await transaction.commit();

      const fresh = await this.findById(id);
      if (!fresh) throw new Error("Product not found after update");
      return fresh;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async changeStatus(id: number, status: ProductStatus) {
    await this.models.Product.update({ status }, { where: { id } });
  }

  async softDelete(id: number) {
    await this.models.Product.update(
      { deleted: 1, deleted_at: new Date() },
      { where: { id } },
    );
  }

  async bulkEdit(ids: number[], patch: UpdateProductPatch) {
    const values: any = {};

    if (patch.categoryId !== undefined) {
      values.product_category_id = patch.categoryId;
    }
    if (patch.title !== undefined) values.title = patch.title;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.price !== undefined) values.price = patch.price;
    if (patch.thumbnail !== undefined) values.thumbnail = patch.thumbnail;
    if (patch.slug !== undefined) values.slug = patch.slug;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.featured !== undefined) values.featured = patch.featured ? 1 : 0;
    if (patch.position !== undefined) values.position = patch.position;
    if (patch.deleted !== undefined) values.deleted = patch.deleted ? 1 : 0;
    if (patch.deleted === true) values.deleted_at = new Date();
    if (patch.deleted === false) values.deleted_at = null;

    const [affected] = await this.models.Product.update(values, {
      where: { id: { [Op.in]: ids } },
    });

    return affected ?? 0;
  }

  async reorderPositions(
    pairs: { id: number; position: number }[],
    updatedById?: number,
  ) {
    const ids = pairs.map((p) => Number(p.id));

    const whenClauses = pairs
      .map((p) => `WHEN ${Number(p.id)} THEN ${Number(p.position)}`)
      .join(" ");

    const setUpdated = "";
    const sql = `
      UPDATE products
      SET position = CASE id ${whenClauses} END
      ${setUpdated}
      WHERE id IN (:ids)
    `;

    const sequelize = this.models.Product.sequelize as any;

    const [result] = await sequelize.query(sql, {
      replacements: { ids, updatedById },
    });

    const affected = result?.affectedRows ?? result ?? ids.length;
    return Number(affected);
  }

  async findVariantById(variantId: number, transaction?: any) {
    const Variant = this.models.ProductVariant;

    if (!Variant) {
      throw new Error("ProductVariant model not provided");
    }

    const include: any[] = [];

    if (this.models.InventoryStock) {
      include.push({
        model: this.models.InventoryStock,
        as: "inventoryStocks",
        attributes: ["id", "branch_id", "quantity", "reserved_quantity"],
        required: false,
      });
    }

    const variant = await Variant.findOne({
      where: { id: variantId },
      include,
      transaction,
    });

    if (!variant) return null;

    const v = this.toPlain(variant);

    const inventoryStocks = Array.isArray(v.inventoryStocks)
      ? v.inventoryStocks
      : [];

    const quantity = inventoryStocks.reduce(
      (sum: number, stock: any) => sum + Number(stock.quantity ?? 0),
      0,
    );

    const reservedQuantity = inventoryStocks.reduce(
      (sum: number, stock: any) => sum + Number(stock.reserved_quantity ?? 0),
      0,
    );

    const availableStock = Math.max(0, quantity - reservedQuantity);

    return {
      id: Number(v.id),
      productId: Number(v.product_id),
      title: v.title ?? null,
      sku: v.sku ?? null,
      price: Number(v.price),
      stock: Number(v.stock ?? availableStock ?? 0),
      availableStock,
      reservedQuantity,
      status: v.status ?? "active",
    };
  }

  async decreaseVariantStock(
    variantId: number,
    quantity: number,
    transaction?: any,
  ) {
    const Variant = this.models.ProductVariant;

    if (!Variant) {
      throw new Error("ProductVariant model not provided");
    }

    const variant = await Variant.findOne({
      where: { id: variantId },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });

    if (!variant) {
      throw new Error(`Variant không tồn tại (ID ${variantId})`);
    }

    const stock = Number(variant.stock ?? 0);

    if (stock < quantity) {
      throw new Error("Không đủ tồn kho variant");
    }

    variant.stock = stock - quantity;
    await variant.save({ transaction });
  }

  async increaseVariantStock(
    variantId: number,
    quantity: number,
    transaction?: any,
  ) {
    const Variant = this.models.ProductVariant;

    if (!Variant) {
      throw new Error("ProductVariant model not provided");
    }

    const variant = await Variant.findOne({
      where: { id: variantId },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });

    if (!variant) return;

    variant.stock = Number(variant.stock ?? 0) + quantity;
    await variant.save({ transaction });
  }

  async updateVariantMirrorStock(
    variantId: number,
    stock: number,
    transaction?: any,
  ): Promise<void> {
    await this.models.ProductVariant.update(
      { stock: Math.max(0, Number(stock || 0)) },
      {
        where: { id: variantId },
        transaction,
      },
    );
  }

  async updateProductMirrorStock(
    productId: number,
    stock: number,
    transaction?: any,
  ): Promise<void> {
    await this.models.Product.update(
      { stock: Math.max(0, Number(stock || 0)) },
      {
        where: { id: productId },
        transaction,
      },
    );
  }

  async listChatCandidates(filter?: {
    q?: string;
    status?: string | null;
    limit?: number;
  }) {
    const result = await this.list({
      page: 1,
      limit: Math.max(1, Number(filter?.limit ?? 20)),
      q: filter?.q,
      status: (filter?.status as any) ?? "active",
      sortBy: "id",
      order: "DESC",
    } as any);

    return result.rows;
  }

}
