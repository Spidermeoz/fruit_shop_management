import { Product } from "../../../domain/products/Products";
import type {
  ProductRepository,
  UpdateProductPatch,
} from "../../../domain/products/ProductRepository";
import type { ProductTagRepository } from "../../../domain/products/ProductTagRepository";
import type { InventoryRepository } from "../../../domain/inventory/InventoryRepository";
import type { BranchRepository } from "../../../domain/branches/BranchRepository";

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
    private inventoryRepo: InventoryRepository,
    private branchRepo: BranchRepository,
  ) {}

  private async seedZeroInventoryForAllActiveBranches(productId: number) {
    const fresh = await this.repo.findById(productId);
    if (!fresh) {
      throw new Error("Product not found after update");
    }

    const variants = Array.isArray(fresh.props.variants)
      ? fresh.props.variants
      : [];
    if (!variants.length) return;

    const { rows: branches } = await this.branchRepo.list({
      status: "active",
      includeDeleted: false,
      limit: 1000,
      offset: 0,
    });

    if (!branches.length) return;

    for (const branch of branches) {
      const branchId = Number(branch.props.id);
      if (!Number.isFinite(branchId) || branchId <= 0) continue;

      for (const variant of variants) {
        const variantId = Number(variant.id);
        if (!Number.isFinite(variantId) || variantId <= 0) continue;

        await this.inventoryRepo.ensureStock(branchId, variantId, 0);
      }
    }
  }

  async execute(id: number, patch: UpdateProductPatch) {
    const existingProduct = await this.repo.findById(id);

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    let sanitizedTagIds: number[] | undefined =
      patch.tagIds !== undefined ? normalizeTagIds(patch.tagIds) : undefined;

    if (sanitizedTagIds && sanitizedTagIds.length > 0) {
      const validTags =
        await this.productTagRepo.findActiveByIds(sanitizedTagIds);

      // Admin-friendly:
      // tự loại bỏ tag đã bị xóa / không còn hợp lệ thay vì throw error
      sanitizedTagIds = validTags
        .map((tag) => Number(tag.id))
        .filter((tagId) => Number.isInteger(tagId) && tagId > 0);
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
      ...(sanitizedTagIds !== undefined ? { tagIds: sanitizedTagIds } : {}),
    };

    const saved = await this.repo.update(id, updatePayload);

    await this.seedZeroInventoryForAllActiveBranches(id);

    return { id: saved.props.id! };
  }
}
