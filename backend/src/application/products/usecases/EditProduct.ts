import { Product } from "../../../domain/products/Products";
import type {
  ProductRepository,
  UpdateProductPatch,
} from "../../../domain/products/ProductRepository";
import type { ProductTagRepository } from "../../../domain/products/ProductTagRepository";

function normalizeTagIds(tagIds?: number[]) {
  if (!Array.isArray(tagIds)) return [];

  return [...new Set(tagIds.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
}

export class EditProduct {
  constructor(
    private repo: ProductRepository,
    private productTagRepo: ProductTagRepository,
  ) {}

  async execute(id: number, patch: UpdateProductPatch) {
    const existingProduct = await this.repo.findById(id);

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    const normalizedTagIds =
      patch.tagIds !== undefined ? normalizeTagIds(patch.tagIds) : undefined;

    if (
      patch.tagIds !== undefined &&
      normalizedTagIds &&
      normalizedTagIds.length > 0
    ) {
      const validTags =
        await this.productTagRepo.findActiveByIds(normalizedTagIds);

      if (validTags.length !== normalizedTagIds.length) {
        throw new Error(
          "Một hoặc nhiều tag không hợp lệ, đã bị xóa hoặc không còn hoạt động",
        );
      }
    }

    const normalizedOptions =
      patch.options !== undefined
        ? patch.options.map((option, optionIndex) => ({
            id: option.id,
            name: String(option.name ?? "").trim(),
            position: option.position ?? optionIndex,
            values: Array.isArray(option.values)
              ? option.values.map((value, valueIndex) => ({
                  id: value.id,
                  value: String(value.value ?? "").trim(),
                  position: value.position ?? valueIndex,
                }))
              : [],
          }))
        : (existingProduct.props.options ?? []);

    const normalizedVariants =
      patch.variants !== undefined
        ? patch.variants.map((variant, index) => ({
            id: variant.id,
            sku: variant.sku ?? null,
            title: variant.title ?? null,
            price: Number(variant.price ?? 0),
            compareAtPrice:
              variant.compareAtPrice !== undefined &&
              variant.compareAtPrice !== null
                ? Number(variant.compareAtPrice)
                : null,
            stock:
              variant.stock !== undefined && variant.stock !== null
                ? Number(variant.stock)
                : undefined,
            status: variant.status ?? "active",
            sortOrder: variant.sortOrder ?? index,
            optionValueIds: Array.isArray(variant.optionValueIds)
              ? [...new Set(variant.optionValueIds.map(Number))].filter(
                  (valueId) => Number.isInteger(valueId) && valueId > 0,
                )
              : [],
            optionValues: Array.isArray((variant as any).optionValues)
              ? (variant as any).optionValues.map((ov: any) => ({
                  id: ov.id,
                  value: String(ov.value ?? "").trim(),
                  optionId:
                    ov.optionId !== undefined && ov.optionId !== null
                      ? Number(ov.optionId)
                      : undefined,
                  optionName: String(ov.optionName ?? "").trim(),
                  position:
                    ov.position !== undefined && ov.position !== null
                      ? Number(ov.position)
                      : undefined,
                }))
              : [],
          }))
        : (existingProduct.props.variants ?? []);

    const updatedProduct = Product.create({
      ...existingProduct.props,
      ...patch,
      title:
        patch.title !== undefined
          ? String(patch.title).trim()
          : existingProduct.props.title,
      options: normalizedOptions,
      variants: normalizedVariants,
    });

    const updatePayload: UpdateProductPatch = {
      categoryId: updatedProduct.props.categoryId,
      title: updatedProduct.props.title,
      description: updatedProduct.props.description ?? null,
      price: updatedProduct.props.price ?? null,
      stock: updatedProduct.props.stock ?? 0,
      thumbnail: updatedProduct.props.thumbnail ?? null,
      slug: updatedProduct.props.slug ?? null,
      status: updatedProduct.props.status,
      featured: updatedProduct.props.featured ?? false,
      position: updatedProduct.props.position ?? null,
      originId: updatedProduct.props.originId ?? null,
      shortDescription: updatedProduct.props.shortDescription ?? null,
      storageGuide: updatedProduct.props.storageGuide ?? null,
      usageSuggestions: updatedProduct.props.usageSuggestions ?? null,
      nutritionNotes: updatedProduct.props.nutritionNotes ?? null,
      updatedById: updatedProduct.props.updatedById ?? null,
      options: normalizedOptions,
      variants: normalizedVariants,
      ...(normalizedTagIds !== undefined ? { tagIds: normalizedTagIds } : {}),
    };

    const saved = await this.repo.update(id, updatePayload);

    return { id: saved.props.id! };
  }
}
