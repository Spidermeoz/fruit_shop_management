// src/interfaces/http/express/controllers/client/ClientCartController.ts

import { Request, Response, NextFunction } from "express";
import {
  AddToCart,
  ListCartItems,
  RemoveAllFromCart,
  RemoveFromCart,
  UpdateCartItem,
} from "../../../../../application/carts";

export const makeClientCartController = (uc: {
  addToCart: AddToCart;
  listItems: ListCartItems;
  updateItem: UpdateCartItem;
  removeItem: RemoveFromCart;
  removeAllItems: RemoveAllFromCart;
}) => {
  return {
    // GET /cart
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number((req as any).user?.id);
        const result = await uc.listItems.execute(userId);

        res.json({
          success: true,
          data: result.items,
        });
      } catch (err) {
        next(err);
      }
    },

    // POST /cart/items
    add: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number((req as any).user?.id);
        const { productVariantId, quantity } = req.body;

        const normalizedVariantId = Number(productVariantId);
        const normalizedQty =
          quantity !== undefined && quantity !== null ? Number(quantity) : 1;

        if (!Number.isFinite(normalizedVariantId) || normalizedVariantId <= 0) {
          throw new Error("productVariantId is invalid");
        }

        if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
          throw new Error("quantity is invalid");
        }

        const item = await uc.addToCart.execute({
          userId,
          productVariantId: normalizedVariantId,
          quantity: normalizedQty,
        });

        res.status(201).json({
          success: true,
          data: item,
        });
      } catch (err) {
        next(err);
      }
    },

    // PATCH /cart/items/:variantId
    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number((req as any).user?.id);
        const productVariantId = Number(req.params.variantId);
        const { quantity } = req.body;
        const normalizedQty = Number(quantity);

        if (!Number.isFinite(productVariantId) || productVariantId <= 0) {
          throw new Error("variantId is invalid");
        }

        if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
          throw new Error("quantity is invalid");
        }

        const item = await uc.updateItem.execute({
          userId,
          productVariantId,
          quantity: normalizedQty,
        });

        res.json({
          success: true,
          data: item,
        });
      } catch (err) {
        next(err);
      }
    },

    // DELETE /cart/items/:variantId
    remove: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number((req as any).user?.id);
        const productVariantId = Number(req.params.variantId);

        if (!Number.isFinite(productVariantId) || productVariantId <= 0) {
          throw new Error("variantId is invalid");
        }

        await uc.removeItem.execute({
          userId,
          productVariantId,
        });

        res.json({
          success: true,
          data: true,
        });
      } catch (err) {
        next(err);
      }
    },

    removeAllItems: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number((req as any).user?.id);
        await uc.removeAllItems.execute(userId);

        res.json({
          success: true,
          data: true,
        });
      } catch (err) {
        next(err);
      }
    },
  };
};

export type ClientCartController = ReturnType<typeof makeClientCartController>;
