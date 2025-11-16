import { Request, Response, NextFunction } from "express";
import { AddToCart } from "../../../../../application/carts/usecases/AddToCart";
import { ListCartItems } from "../../../../../application/carts/usecases/ListCartItems";
import { UpdateCartItem } from "../../../../../application/carts/usecases/UpdateCartItem";
import { RemoveFromCart } from "../../../../../application/carts/usecases/RemoveFromCart";

export const makeClientCartController = (uc: {
  addToCart: AddToCart;
  listItems: ListCartItems;
  updateItem: UpdateCartItem;
  removeItem: RemoveFromCart;
}) => {
  return {
    // GET /api/v1/client/cart
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

    // POST /api/v1/client/cart/items
    add: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number((req as any).user?.id);
        const { productId, quantity } = req.body;

        const item = await uc.addToCart.execute({
          userId,
          productId: Number(productId),
          quantity: quantity !== undefined ? Number(quantity) : 1,
        });

        res.status(201).json({
          success: true,
          data: item,
        });
      } catch (err) {
        next(err);
      }
    },

    // PATCH /api/v1/client/cart/items/:productId
    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number((req as any).user?.id);
        const productId = Number(req.params.productId);
        const { quantity } = req.body;

        const item = await uc.updateItem.execute({
          userId,
          productId,
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

    // DELETE /api/v1/client/cart/items/:productId
    remove: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number((req as any).user?.id);
        const productId = Number(req.params.productId);

        await uc.removeItem.execute({ userId, productId });

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
