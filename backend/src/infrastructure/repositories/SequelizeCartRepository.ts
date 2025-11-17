import type { CartRepository } from "../../domain/carts/CartRepository";
import type { CartItemDTO } from "../../domain/carts/types";

type Models = {
  Cart: any;
  CartItem: any;
  Product: any;
};

export class SequelizeCartRepository implements CartRepository {
  constructor(private models: Models) {}

  private mapRow(row: any): CartItemDTO {
    const p = row.product ?? row.Product ?? null;

    const product = p
      ? {
          id: Number(p.id),
          title: String(p.title),
          price:
            p.price !== null && p.price !== undefined ? Number(p.price) : null,
          thumbnail: p.thumbnail ?? null,
          slug: p.slug ?? null,
        }
      : null;

    return {
      id: Number(row.id),
      cartId: Number(row.cart_id),
      productId: Number(row.product_id),
      quantity: Number(row.quantity),
      createdAt: row.created_at ?? row.createdAt,
      updatedAt: row.updated_at ?? row.updatedAt,
      product,
    };
  }

  private async getOrCreateCart(userId: number) {
    const [cart] = await this.models.Cart.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });
    return cart;
  }

  // =====================================================
  // ADD ITEM
  // =====================================================
  async addItem(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<CartItemDTO> {
    if (quantity <= 0) throw new Error("Quantity must be greater than 0");

    const cart = await this.getOrCreateCart(userId);

    const [item, created] = await this.models.CartItem.findOrCreate({
      where: { cart_id: cart.id, product_id: productId },
      defaults: {
        cart_id: cart.id,
        product_id: productId,
        quantity,
      },
    });

    if (!created) {
      item.quantity = Number(item.quantity) + quantity;
      await item.save();
    }

    const withProduct = await this.models.CartItem.findByPk(item.id, {
      include: [
        {
          model: this.models.Product,
          as: "product",
          attributes: ["id", "title", "price", "thumbnail", "slug"],
        },
      ],
    });

    return this.mapRow(withProduct ?? item);
  }

  // =====================================================
  // LIST ALL ITEMS
  // =====================================================
  async listItems(userId: number): Promise<CartItemDTO[]> {
    const cart = await this.getOrCreateCart(userId);

    const rows = await this.models.CartItem.findAll({
      where: { cart_id: cart.id },
      include: [
        {
          model: this.models.Product,
          as: "product",
          attributes: ["id", "title", "price", "thumbnail", "slug"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return rows.map((r: any) => this.mapRow(r));
  }

  // =====================================================
  // UPDATE ITEM
  // =====================================================
  async updateItem(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<CartItemDTO> {
    if (quantity <= 0) throw new Error("Quantity must be greater than 0");

    const cart = await this.getOrCreateCart(userId);

    const item = await this.models.CartItem.findOne({
      where: { cart_id: cart.id, product_id: productId },
    });

    if (!item) throw new Error("Cart item not found");

    item.quantity = quantity;
    await item.save();

    const withProduct = await this.models.CartItem.findByPk(item.id, {
      include: [
        {
          model: this.models.Product,
          as: "product",
          attributes: ["id", "title", "price", "thumbnail", "slug"],
        },
      ],
    });

    return this.mapRow(withProduct ?? item);
  }

  // =====================================================
  // REMOVE ITEM
  // =====================================================
  async removeItem(userId: number, productId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);

    await this.models.CartItem.destroy({
      where: { cart_id: cart.id, product_id: productId },
    });
  }

  // =====================================================
  // LIST SELECTED ITEMS FOR CHECKOUT
  // =====================================================
  async listSelectedItems(
    userId: number,
    productIds: number[]
  ): Promise<CartItemDTO[]> {
    if (!productIds.length) return []; // ⚠ bảo vệ SQL IN ()

    const cart = await this.getOrCreateCart(userId);

    const rows = await this.models.CartItem.findAll({
      where: {
        cart_id: cart.id,
        product_id: productIds,
      },
      include: [
        {
          model: this.models.Product,
          as: "product",
          attributes: ["id", "title", "price", "thumbnail", "slug"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return rows.map((r: any) => this.mapRow(r));
  }

  // =====================================================
  // CLEAR SELECTED ITEMS AFTER CHECKOUT
  // =====================================================
  async clearSelectedItems(
    userId: number,
    productIds: number[]
  ): Promise<void> {
    if (!productIds.length) return; // ⚠ tránh SQL lỗi

    const cart = await this.getOrCreateCart(userId);

    await this.models.CartItem.destroy({
      where: {
        cart_id: cart.id,
        product_id: productIds,
      },
    });
  }
}
