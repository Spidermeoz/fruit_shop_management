import type { CartRepository } from "../../domain/carts/CartRepository";
import type { CartItemDTO } from "../../domain/carts/types";

type Models = {
  Cart: any;
  CartItem: any;
  Product: any;
  ProductVariant: any;
  InventoryStock?: any;
  ProductVariantValue?: any;
  ProductOptionValue?: any;
  ProductOption?: any;
};

export class SequelizeCartRepository implements CartRepository {
  constructor(private models: Models) {}

  private mapRow(row: any): CartItemDTO {
    const productRow =
      row.product ??
      row.Product ??
      row.variant?.product ??
      row.variant?.Product ??
      null;

    const variantRow = row.variant ?? row.ProductVariant ?? null;

    const inventoryRow = variantRow?.inventoryStock ?? null;

    const product = productRow
      ? {
          id: Number(productRow.id),
          title: String(productRow.title),
          thumbnail: productRow.thumbnail ?? null,
          slug: productRow.slug ?? null,
        }
      : null;

    const optionValues = Array.isArray(variantRow?.variantValues)
      ? variantRow.variantValues
          .map((vv: any) => vv?.optionValue)
          .filter(Boolean)
          .map((ov: any) => ({
            id: Number(ov.id),
            value: String(ov.value),
            optionId:
              ov.product_option_id !== undefined &&
              ov.product_option_id !== null
                ? Number(ov.product_option_id)
                : undefined,
            optionName: ov.option?.name ?? undefined,
          }))
      : [];

    const quantity = Number(inventoryRow?.quantity ?? variantRow?.stock ?? 0);
    const reservedQuantity = Number(inventoryRow?.reserved_quantity ?? 0);
    const availableStock = Math.max(0, quantity - reservedQuantity);

    const variant = variantRow
      ? {
          id: Number(variantRow.id),
          productId: Number(variantRow.product_id),
          title: variantRow.title ?? null,
          sku: variantRow.sku ?? null,
          price: Number(variantRow.price),
          compareAtPrice:
            variantRow.compare_at_price !== null &&
            variantRow.compare_at_price !== undefined
              ? Number(variantRow.compare_at_price)
              : null,
          stock: Number(variantRow.stock ?? 0), // mirror
          availableStock,
          reservedQuantity,
          status: variantRow.status ?? "active",
          optionValues,
        }
      : null;

    return {
      id: Number(row.id),
      cartId: Number(row.cart_id),
      productId:
        row.product_id !== null && row.product_id !== undefined
          ? Number(row.product_id)
          : product
            ? Number(product.id)
            : variant
              ? Number(variant.productId)
              : null,
      productVariantId:
        row.product_variant_id !== null && row.product_variant_id !== undefined
          ? Number(row.product_variant_id)
          : null,
      quantity: Number(row.quantity),
      unitPrice: variant ? Number(variant.price) : null,
      createdAt: row.created_at ?? row.createdAt,
      updatedAt: row.updated_at ?? row.updatedAt,
      product,
      variant,
    };
  }

  private async getOrCreateCart(userId: number) {
    const [cart] = await this.models.Cart.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });
    return cart;
  }

  private buildVariantInclude() {
    const variantInclude: any[] = [
      {
        model: this.models.Product,
        as: "product",
        attributes: ["id", "title", "thumbnail", "slug"],
      },
    ];

    if (this.models.InventoryStock) {
      variantInclude.push({
        model: this.models.InventoryStock,
        as: "inventoryStock",
        attributes: ["id", "quantity", "reserved_quantity"],
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

    return [
      {
        model: this.models.ProductVariant,
        as: "variant",
        attributes: [
          "id",
          "product_id",
          "sku",
          "title",
          "price",
          "compare_at_price",
          "stock",
          "status",
        ],
        include: variantInclude,
      },
    ];
  }

  private async findCartByUserId(userId: number) {
    return await this.models.Cart.findOne({
      where: { user_id: userId },
    });
  }

  async addItem(
    userId: number,
    productVariantId: number,
    quantity: number,
  ): Promise<CartItemDTO> {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const cart = await this.getOrCreateCart(userId);

    const variant = await this.models.ProductVariant.findByPk(
      productVariantId,
      {
        include: [
          {
            model: this.models.Product,
            as: "product",
            attributes: ["id"],
          },
        ],
      },
    );

    if (!variant) {
      throw new Error("Product variant not found");
    }
    if (variant.status !== "active") {
      throw new Error("Product variant is inactive");
    }

    const productId =
      variant.product_id !== undefined && variant.product_id !== null
        ? Number(variant.product_id)
        : Number(variant.product?.id);

    const [item, created] = await this.models.CartItem.findOrCreate({
      where: { cart_id: cart.id, product_variant_id: productVariantId },
      defaults: {
        cart_id: cart.id,
        product_id: productId,
        product_variant_id: productVariantId,
        quantity,
      },
    });

    if (!created) {
      item.quantity = Number(item.quantity) + quantity;
      if (!item.product_id) {
        item.product_id = productId;
      }
      await item.save();
    }

    const withRelations = await this.models.CartItem.findByPk(item.id, {
      include: this.buildVariantInclude(),
    });

    return this.mapRow(withRelations ?? item);
  }

  async listItems(userId: number): Promise<CartItemDTO[]> {
    const cart = await this.getOrCreateCart(userId);

    const rows = await this.models.CartItem.findAll({
      where: { cart_id: cart.id },
      include: this.buildVariantInclude(),
      order: [["created_at", "ASC"]],
    });

    return rows.map((r: any) => this.mapRow(r));
  }

  async updateItem(
    userId: number,
    productVariantId: number,
    quantity: number,
  ): Promise<CartItemDTO> {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const cart = await this.getOrCreateCart(userId);

    const item = await this.models.CartItem.findOne({
      where: { cart_id: cart.id, product_variant_id: productVariantId },
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    item.quantity = quantity;
    await item.save();

    const withRelations = await this.models.CartItem.findByPk(item.id, {
      include: this.buildVariantInclude(),
    });

    return this.mapRow(withRelations ?? item);
  }

  async removeItem(userId: number, productVariantId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);

    await this.models.CartItem.destroy({
      where: { cart_id: cart.id, product_variant_id: productVariantId },
    });
  }

  async removeAllItems(userId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    if (!cart) return;

    await this.models.CartItem.destroy({
      where: { cart_id: cart.id },
    });
  }

  async listSelectedItems(
    userId: number,
    productVariantIds: number[],
  ): Promise<CartItemDTO[]> {
    if (!productVariantIds.length) return [];

    const cart = await this.getOrCreateCart(userId);

    const rows = await this.models.CartItem.findAll({
      where: {
        cart_id: cart.id,
        product_variant_id: productVariantIds,
      },
      include: this.buildVariantInclude(),
      order: [["created_at", "ASC"]],
    });

    return rows.map((r: any) => this.mapRow(r));
  }

  async clearSelectedItems(
    userId: number,
    productVariantIds: number[],
    transaction?: any,
  ): Promise<void> {
    if (!productVariantIds.length) return;

    const cart = await this.findCartByUserId(userId);
    if (!cart) return;

    await this.models.CartItem.destroy({
      where: {
        cart_id: cart.id,
        product_variant_id: productVariantIds,
      },
      transaction,
    });
  }
}
