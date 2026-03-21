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

        const item = await uc.addToCart.execute({
          userId,
          productVariantId: Number(productVariantId),
          quantity: quantity ? Number(quantity) : 1,
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

        const item = await uc.updateItem.execute({
          userId,
          productVariantId,
          quantity: Number(quantity),
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
