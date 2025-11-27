export function mapProduct(p: any) {
  return {
    id: p.id,

    // Giữ kiểu cũ để FE khác vẫn chạy
    category_id: p.categoryId ?? p.product_category_id ?? null,
    category_title: p.category?.title ?? null,

    // 👉 Thêm field category để biểu đồ có thể dùng
    category: p.category
      ? {
          id: p.category.id,
          title: p.category.title,
        }
      : null,

    title: p.title,
    slug: p.slug,
    image: p.thumbnail,

    price: p.price,
    effective_price: p.effectivePrice ?? p.price,
    discount_percentage: p.discountPercentage ?? 0,

    stock: p.stock,
    status: p.status,

    featured: p.featured,
    position: p.position,

    average_rating: p.averageRating ?? 0,
    review_count: p.reviewCount ?? 0,

    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}
