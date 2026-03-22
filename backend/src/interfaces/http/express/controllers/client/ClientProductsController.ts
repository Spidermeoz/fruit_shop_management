import { Request, Response, NextFunction } from "express";
import { ListProducts } from "../../../../../application/products/usecases/ListProducts";
import { GetProductDetail } from "../../../../../application/products/usecases/GetProductDetail";
import { ProductListFilter } from "../../../../../domain/products/types";
import ProductCategoryModel from "../../../../../infrastructure/db/sequelize/models/ProductCategoryModel";

const toNum = (v: any) => (v === undefined ? undefined : Number(v));

const normalizeProduct = (raw: any) => {
  const p = raw?.props ?? raw;

  const variants = Array.isArray(p?.variants)
    ? p.variants.map((v: any) => ({
        id: Number(v.id),
        productId:
          v.productId !== undefined && v.productId !== null
            ? Number(v.productId)
            : null,
        sku: v.sku ?? null,
        title: v.title ?? null,
        price: Number(v.price ?? 0),
        compareAtPrice:
          v.compareAtPrice !== undefined && v.compareAtPrice !== null
            ? Number(v.compareAtPrice)
            : v.compare_at_price !== undefined && v.compare_at_price !== null
              ? Number(v.compare_at_price)
              : null,
        stock: Number(v.stock ?? 0),
        status: v.status ?? "active",
        sortOrder: Number(v.sortOrder ?? v.sort_order ?? 0),
        optionValueIds: Array.isArray(v.optionValueIds)
          ? v.optionValueIds.map((x: any) => Number(x))
          : [],
        optionValues: Array.isArray(v.optionValues)
          ? v.optionValues.map((ov: any) => ({
              id: Number(ov.id),
              value: ov.value,
              optionId:
                ov.optionId !== undefined && ov.optionId !== null
                  ? Number(ov.optionId)
                  : undefined,
              optionName: ov.optionName ?? undefined,
              position:
                ov.position !== undefined && ov.position !== null
                  ? Number(ov.position)
                  : undefined,
            }))
          : [],
        origin: p.origin ?? null,
        tags: p.tags ?? [],
        shortDescription: p.shortDescription ?? null,
        storageGuide: p.storageGuide ?? null,
        usageSuggestions: p.usageSuggestions ?? null,
        nutritionNotes: p.nutritionNotes ?? null,
      }))
    : [];

  const options = Array.isArray(p?.options)
    ? p.options.map((o: any) => ({
        id: Number(o.id),
        name: o.name ?? o.title ?? "",
        position: Number(o.position ?? 0),
        values: Array.isArray(o.values)
          ? o.values.map((value: any) => ({
              id: Number(value.id),
              value: value.value,
              position: Number(value.position ?? 0),
            }))
          : [],
      }))
    : [];

  const activeVariants = variants.filter((v: any) => v.status === "active");
  const sourceVariants = activeVariants.length ? activeVariants : variants;

  const minVariantPrice = sourceVariants.length
    ? Math.min(...sourceVariants.map((v: any) => Number(v.price ?? 0)))
    : null;

  const maxVariantPrice = sourceVariants.length
    ? Math.max(...sourceVariants.map((v: any) => Number(v.price ?? 0)))
    : null;

  const totalStock =
    p?.totalStock !== undefined && p?.totalStock !== null && p.totalStock > 0
      ? Number(p.totalStock)
      : variants.length > 0
        ? variants.reduce(
            (sum: number, v: any) => sum + Number(v.stock ?? 0),
            0,
          )
        : Number(p.stock ?? 0);

  const basePrice =
    p?.price !== undefined && p?.price !== null
      ? Number(p.price)
      : minVariantPrice;

  const discountPercentage =
    p?.discountPercentage !== undefined && p?.discountPercentage !== null
      ? Number(p.discountPercentage)
      : null;

  return {
    id: Number(p.id),
    categoryId:
      p.categoryId !== undefined && p.categoryId !== null
        ? Number(p.categoryId)
        : p.product_category_id !== undefined && p.product_category_id !== null
          ? Number(p.product_category_id)
          : null,
    product_category_id:
      p.product_category_id !== undefined && p.product_category_id !== null
        ? Number(p.product_category_id)
        : p.categoryId !== undefined && p.categoryId !== null
          ? Number(p.categoryId)
          : null,
    title: p.title,
    description: p.description ?? null,
    price: basePrice,
    discountPercentage,
    stock:
      p.stock !== undefined && p.stock !== null ? Number(p.stock) : totalStock,
    totalStock,
    thumbnail: p.thumbnail ?? null,
    slug: p.slug ?? null,
    status: p.status,
    featured: !!p.featured,
    position:
      p.position !== undefined && p.position !== null
        ? Number(p.position)
        : null,
    averageRating: Number(p.averageRating ?? 0),
    reviewCount: Number(p.reviewCount ?? 0),
    deleted: !!p.deleted,
    deletedAt: p.deletedAt ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    createdById:
      p.createdById !== undefined && p.createdById !== null
        ? Number(p.createdById)
        : null,
    updatedById:
      p.updatedById !== undefined && p.updatedById !== null
        ? Number(p.updatedById)
        : null,
    effectivePrice:
      basePrice !== null &&
      discountPercentage !== null &&
      discountPercentage > 0
        ? basePrice * (1 - discountPercentage / 100)
        : basePrice,
    category: p.category
      ? {
          id: Number(p.category.id),
          title: p.category.title,
        }
      : null,
    variants,
    options,
    defaultVariantId:
      p.defaultVariantId !== undefined && p.defaultVariantId !== null
        ? Number(p.defaultVariantId)
        : (activeVariants[0]?.id ?? variants[0]?.id ?? null),
    priceRange:
      p.priceRange?.min !== undefined && p.priceRange?.max !== undefined
        ? {
            min: Number(p.priceRange.min),
            max: Number(p.priceRange.max),
          }
        : minVariantPrice !== null && maxVariantPrice !== null
          ? { min: minVariantPrice, max: maxVariantPrice }
          : basePrice !== null
            ? { min: basePrice, max: basePrice }
            : null,
  };
};

export const makeClientProductsController = (uc: {
  list: ListProducts;
  detail: GetProductDetail;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          categoryId,
          category,
          minPrice,
          maxPrice,
          sortBy,
          order,
          featured,
        } = req.query;

        let categoryIds: number[] | null = null;

        if (category && !categoryId) {
          const cat = await ProductCategoryModel.findOne({
            where: {
              slug: String(category).replace(/_/g, "-"),
              deleted: 0,
            },
            attributes: ["id"],
          });

          if (cat) {
            const rootId = Number(cat.getDataValue("id"));

            interface CategoryNode {
              id: number;
              parent_id: number | null;
            }

            const allCategories = (await ProductCategoryModel.findAll({
              where: { deleted: 0 },
              attributes: ["id", "parent_id"],
              raw: true,
            })) as unknown as CategoryNode[];

            const collectChildren = (parentId: number): number[] => {
              const children = allCategories
                .filter((c) => c.parent_id === parentId)
                .map((c) => c.id);

              const deeper = children.flatMap((childId) =>
                collectChildren(childId),
              );

              return [...children, ...deeper];
            };

            const childrenIds = collectChildren(rootId);
            categoryIds = [rootId, ...childrenIds];
          }
        } else if (categoryId) {
          categoryIds = [Number(categoryId)];
        }

        const featuredAsBoolean =
          featured === "true" ? true : featured === "false" ? false : undefined;

        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 12,
          q: q as string,
          categoryId: categoryIds?.length ? categoryIds : null,
          status: "active",
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sortBy: (sortBy as ProductListFilter["sortBy"]) ?? "position",
          order: (order as ProductListFilter["order"]) ?? "ASC",
          featured: featuredAsBoolean,
        });

        const result = data.rows.map(normalizeProduct);

        return res.json({
          success: true,
          data: result,
          meta: {
            total: data.count,
            page: Number(page ?? 1),
            limit: Number(limit ?? 12),
          },
        });
      } catch (err) {
        next(err);
      }
    },

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);
        const normalized = normalizeProduct(dto);

        if (!normalized || normalized.status !== "active") {
          return res.status(404).json({
            success: false,
            message: "Product not found or inactive",
          });
        }

        return res.json({
          success: true,
          data: normalized,
        });
      } catch (err) {
        next(err);
      }
    },
  };
};

export type ClientProductsController = ReturnType<
  typeof makeClientProductsController
>;
