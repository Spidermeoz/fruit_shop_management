// src/domain/products/Products.ts
import type {
  ProductOptionInput,
  ProductPriceRange,
  ProductStatus,
  ProductVariantInput,
  ProductVariantStatus,
} from "./types";

export interface ProductVariantProps {
  id?: number;
  productId?: number;
  sku?: string | null;
  title?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  status: ProductVariantStatus;
  sortOrder?: number;
  optionValueIds?: number[];
  optionValues?: {
    id: number;
    value: string;
    optionId?: number;
    optionName?: string;
    position?: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductOptionValueProps {
  id?: number;
  value: string;
  position?: number;
}

export interface ProductOptionProps {
  id?: number;
  name: string;
  position?: number;
  values: ProductOptionValueProps[];
}

export interface ProductProps {
  id?: number;
  categoryId?: number | null;
  title: string;
  description?: string | null;

  // Transitional fallback fields
  price?: number | null;
  stock: number;

  thumbnail?: string | null;
  slug?: string | null;
  status: ProductStatus;
  featured?: boolean;
  position?: number | null;

  averageRating?: number;
  reviewCount?: number;

  originId?: number | null;

  shortDescription?: string | null;
  storageGuide?: string | null;
  usageSuggestions?: string | null;
  nutritionNotes?: string | null;

  origin?: { id: number; name: string; slug: string } | null;
  tags?: {
    id: number;
    name: string;
    slug: string;
    productTagGroupId?: number | null;
    group?: {
      id: number;
      name: string;
      slug: string | null;
    } | null;
  }[];

  deleted?: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number | null;
  updatedById?: number | null;

  category?: { id: number; title: string } | null;

  variants?: ProductVariantProps[];
  options?: ProductOptionProps[];
  defaultVariantId?: number | null;
  priceRange?: ProductPriceRange | null;
  totalStock?: number;
}

export class Product {
  private _props: ProductProps;

  private constructor(props: ProductProps) {
    this._props = Product.validate(props);
  }

  static create(props: ProductProps) {
    return new Product(props);
  }

  get props(): Readonly<ProductProps> {
    return this._props;
  }

  get id() {
    return this._props.id;
  }

  get title() {
    return this._props.title;
  }

  get price() {
    return this._props.price;
  }

  get stock() {
    return this._props.stock;
  }

  get variants() {
    return this._props.variants ?? [];
  }

  get options() {
    return this._props.options ?? [];
  }

  static validate(p: ProductProps): ProductProps {
    if (!p.title || !p.title.toString().trim()) {
      throw new Error("Product.title is required");
    }

    if (p.stock != null && p.stock < 0) {
      throw new Error("Product.stock must be >= 0");
    }

    if (p.price != null && p.price < 0) {
      throw new Error("Product.price must be >= 0");
    }

    if (
      p.averageRating != null &&
      (p.averageRating < 0 || p.averageRating > 5)
    ) {
      throw new Error("Product.averageRating must be between 0 and 5");
    }

    if (p.reviewCount != null && p.reviewCount < 0) {
      throw new Error("Product.reviewCount must be >= 0");
    }

    const variants = (p.variants ?? []).map(Product.validateVariant);
    const options = (p.options ?? []).map(Product.validateOption);

    const totalStock =
      p.totalStock ??
      variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0);

    const computedPriceRange =
      p.priceRange ??
      (variants.length
        ? {
            minPrice: Math.min(...variants.map((v) => v.price)),
            maxPrice: Math.max(...variants.map((v) => v.price)),
          }
        : {
            minPrice: p.price ?? null,
            maxPrice: p.price ?? null,
          });

    const normalized: ProductProps = {
      ...p,
      featured: p.featured ?? false,
      stock: p.stock ?? totalStock ?? 0,
      reviewCount: p.reviewCount ?? 0,
      averageRating: p.averageRating ?? 0,
      deleted: p.deleted ?? false,
      variants,
      options,
      totalStock,
      priceRange: computedPriceRange,
      defaultVariantId:
        p.defaultVariantId ??
        (variants.length > 0 ? (variants[0].id ?? null) : null),
    };

    return normalized;
  }

  static validateVariant(v: ProductVariantProps): ProductVariantProps {
    if (v.price == null || v.price < 0) {
      throw new Error("Variant.price must be >= 0");
    }

    if (v.stock == null || v.stock < 0) {
      throw new Error("Variant.stock must be >= 0");
    }

    if (v.compareAtPrice != null && v.compareAtPrice < 0) {
      throw new Error("Variant.compareAtPrice must be >= 0");
    }

    return {
      ...v,
      status: v.status ?? "active",
      sortOrder: v.sortOrder ?? 0,
      optionValueIds: v.optionValueIds ?? [],
      optionValues: v.optionValues ?? [],
    };
  }

  static validateOption(o: ProductOptionProps): ProductOptionProps {
    if (!o.name || !o.name.toString().trim()) {
      throw new Error("Option.name is required");
    }

    return {
      ...o,
      position: o.position ?? 0,
      values: (o.values ?? []).map((value) => {
        if (!value.value || !value.value.toString().trim()) {
          throw new Error("Option value is required");
        }
        return {
          ...value,
          position: value.position ?? 0,
        };
      }),
    };
  }

  changeStatus(next: ProductStatus) {
    this._props = Product.validate({
      ...this._props,
      status: next,
    });
  }

  updateStock(newStock: number) {
    if (newStock < 0) {
      throw new Error("Stock cannot be negative");
    }

    this._props = Product.validate({
      ...this._props,
      stock: newStock,
      totalStock: newStock,
    });
  }

  replaceVariants(variants: ProductVariantProps[]) {
    this._props = Product.validate({
      ...this._props,
      variants,
    });
  }

  replaceOptions(options: ProductOptionProps[]) {
    this._props = Product.validate({
      ...this._props,
      options,
    });
  }
}

export type CreateProductWithVariantsInput = {
  categoryId?: number | null;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  slug?: string | null;
  status?: ProductStatus;
  featured?: boolean;
  position?: number | null;
  createdById?: number | null;
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
};
