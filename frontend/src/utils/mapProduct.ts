export function mapProduct(raw: any) {
  const p = raw?.props ?? raw ?? {};

  const toNumberOrNull = (value: any) => {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const variants = Array.isArray(p.variants)
    ? p.variants.map((v: any, index: number) => ({
        id: Number(v.id),
        productId:
          v.productId !== undefined && v.productId !== null
            ? Number(v.productId)
            : v.product_id !== undefined && v.product_id !== null
              ? Number(v.product_id)
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
        availableStock:
          v.availableStock !== undefined && v.availableStock !== null
            ? Number(v.availableStock)
            : v.available_stock !== undefined && v.available_stock !== null
              ? Number(v.available_stock)
              : undefined,
        reservedQuantity:
          v.reservedQuantity !== undefined && v.reservedQuantity !== null
            ? Number(v.reservedQuantity)
            : v.reserved_quantity !== undefined && v.reserved_quantity !== null
              ? Number(v.reserved_quantity)
              : undefined,
        inventory: v.inventory
          ? {
              id:
                v.inventory.id !== undefined && v.inventory.id !== null
                  ? Number(v.inventory.id)
                  : undefined,
              quantity: Number(v.inventory.quantity ?? 0),
              reservedQuantity: Number(
                v.inventory.reservedQuantity ??
                  v.inventory.reserved_quantity ??
                  0,
              ),
              availableQuantity: Number(
                v.inventory.availableQuantity ??
                  v.inventory.available_quantity ??
                  0,
              ),
              createdAt:
                v.inventory.createdAt ?? v.inventory.created_at ?? null,
              updatedAt:
                v.inventory.updatedAt ?? v.inventory.updated_at ?? null,
            }
          : null,
        status: v.status ?? "active",
        sortOrder: Number(v.sortOrder ?? v.sort_order ?? index),
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
      }))
    : [];

  const options = Array.isArray(p.options)
    ? p.options.map((o: any, index: number) => ({
        id: Number(o.id),
        name: o.name ?? o.title ?? "",
        position: Number(o.position ?? index),
        values: Array.isArray(o.values)
          ? o.values.map((value: any, valueIndex: number) => ({
              id: Number(value.id),
              value: value.value ?? "",
              position: Number(value.position ?? valueIndex),
            }))
          : [],
      }))
    : [];

  const activeVariants = variants.filter((v: any) => v.status === "active");
  const priceSource = activeVariants.length ? activeVariants : variants;

  const minVariantPrice = priceSource.length
    ? Math.min(...priceSource.map((v: any) => Number(v.price ?? 0)))
    : null;

  const maxVariantPrice = priceSource.length
    ? Math.max(...priceSource.map((v: any) => Number(v.price ?? 0)))
    : null;

  const variantsTotalStock = variants.reduce((sum: number, v: any) => {
    return (
      sum +
      Number(v.availableStock ?? v.inventory?.availableQuantity ?? v.stock ?? 0)
    );
  }, 0);

  const rawTotalStock = toNumberOrNull(p.totalStock);
  const rawProductStock = toNumberOrNull(p.stock);

  const hasVariants = variants.length > 0;

  const totalStock =
    rawTotalStock !== null
      ? rawTotalStock
      : hasVariants
        ? variantsTotalStock
        : (rawProductStock ?? 0);

  const mirroredProductStock =
    hasVariants || rawTotalStock !== null
      ? totalStock
      : (rawProductStock ?? totalStock);

  const basePrice =
    p.price !== undefined && p.price !== null && p.price !== ""
      ? Number(p.price)
      : (minVariantPrice ?? 0);

  return {
    id: Number(p.id),

    category_id:
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
    category_title: p.category?.title ?? null,
    category: p.category
      ? {
          id:
            p.category.id !== undefined && p.category.id !== null
              ? Number(p.category.id)
              : undefined,
          title: p.category.title,
        }
      : null,

    title: p.title,
    description: p.description ?? null,
    slug: p.slug ?? null,

    image: p.thumbnail ?? p.image ?? null,
    thumbnail: p.thumbnail ?? p.image ?? null,

    price: basePrice,
    stock: mirroredProductStock,
    totalStock,

    status: p.status,
    featured: !!p.featured,
    position:
      p.position !== undefined && p.position !== null
        ? Number(p.position)
        : null,

    average_rating: Number(p.averageRating ?? p.average_rating ?? 0),
    review_count: Number(p.reviewCount ?? p.review_count ?? 0),

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
          : { min: basePrice, max: basePrice },

    origin: p.origin ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    shortDescription: p.shortDescription ?? p.short_description ?? null,
    storageGuide: p.storageGuide ?? p.storage_guide ?? null,
    usageSuggestions: p.usageSuggestions ?? p.usage_suggestions ?? null,
    nutritionNotes: p.nutritionNotes ?? p.nutrition_notes ?? null,
    reviewCount: Number(p.reviewCount ?? p.review_count ?? 0),
    averageRating: Number(p.averageRating ?? p.average_rating ?? 0),

    created_at: p.createdAt ?? p.created_at,
    updated_at: p.updatedAt ?? p.updated_at,
  };
}
