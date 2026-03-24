import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { http, tokenStore } from "../services/http";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: number;
  cartId: number;
  productId: number | null;
  productVariantId: number;
  quantity: number;
  unitPrice?: number;

  product?: {
    id: number;
    title: string;
    thumbnail: string | null;
    slug: string | null;
  } | null;

  variant?: {
    id: number;
    title?: string | null;
    sku?: string | null;
    price: number;
    stock: number; // mirror
    availableStock?: number;
    reservedQuantity?: number;
    status?: string;
    optionValues?: Array<{
      id: number;
      value: string;
      optionId?: number;
      optionName?: string;
    }>;
  } | null;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  isLoading: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (productVariantId: number, qty?: number) => Promise<void>;
  updateItem: (productVariantId: number, qty: number) => Promise<void>;
  removeItem: (productVariantId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

const mapCartItem = (raw: any): CartItem => ({
  id: Number(raw.id),
  cartId: Number(raw.cartId ?? raw.cart_id ?? 0),
  productId:
    raw.productId !== undefined && raw.productId !== null
      ? Number(raw.productId)
      : raw.product_id !== undefined && raw.product_id !== null
        ? Number(raw.product_id)
        : null,
  productVariantId: Number(raw.productVariantId ?? raw.product_variant_id),
  quantity: Number(raw.quantity ?? 0),
  unitPrice:
    raw.unitPrice !== undefined && raw.unitPrice !== null
      ? Number(raw.unitPrice)
      : raw.unit_price !== undefined && raw.unit_price !== null
        ? Number(raw.unit_price)
        : undefined,
  product: raw.product
    ? {
        id: Number(raw.product.id),
        title: raw.product.title,
        thumbnail: raw.product.thumbnail ?? null,
        slug: raw.product.slug ?? null,
      }
    : null,
  variant: raw.variant
    ? {
        id: Number(raw.variant.id),
        title: raw.variant.title ?? null,
        sku: raw.variant.sku ?? null,
        price: Number(raw.variant.price ?? 0),
        stock: Number(raw.variant.stock ?? 0),
        availableStock:
          raw.variant.availableStock !== undefined &&
          raw.variant.availableStock !== null
            ? Number(raw.variant.availableStock)
            : raw.variant.available_stock !== undefined &&
                raw.variant.available_stock !== null
              ? Number(raw.variant.available_stock)
              : undefined,
        reservedQuantity:
          raw.variant.reservedQuantity !== undefined &&
          raw.variant.reservedQuantity !== null
            ? Number(raw.variant.reservedQuantity)
            : raw.variant.reserved_quantity !== undefined &&
                raw.variant.reserved_quantity !== null
              ? Number(raw.variant.reserved_quantity)
              : undefined,
        status: raw.variant.status ?? "active",
        optionValues: Array.isArray(raw.variant.optionValues)
          ? raw.variant.optionValues.map((ov: any) => ({
              id: Number(ov.id),
              value: ov.value,
              optionId:
                ov.optionId !== undefined && ov.optionId !== null
                  ? Number(ov.optionId)
                  : undefined,
              optionName: ov.optionName ?? undefined,
            }))
          : [],
      }
    : null,
});

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await http("GET", "/api/v1/client/cart");
      if (res?.success && Array.isArray(res.data)) {
        setItems(res.data.map(mapCartItem));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Lỗi load giỏ hàng:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = useCallback(
    async (productVariantId: number, qty: number = 1) => {
      if (!isAuthenticated) return;

      try {
        const res = await http("POST", "/api/v1/client/cart/items", {
          productVariantId,
          quantity: qty,
        });

        if (res?.success) {
          await fetchCart();
        }
      } catch (err) {
        console.error("Lỗi thêm vào giỏ hàng:", err);
        throw err;
      }
    },
    [isAuthenticated, fetchCart],
  );

  const updateItem = useCallback(
    async (productVariantId: number, qty: number) => {
      try {
        const res = await http(
          "PATCH",
          `/api/v1/client/cart/items/${productVariantId}`,
          { quantity: qty },
        );

        if (res?.success) {
          await fetchCart();
        }
      } catch (err) {
        console.error("Lỗi cập nhật giỏ hàng:", err);
        throw err;
      }
    },
    [fetchCart],
  );

  const removeItem = useCallback(
    async (productVariantId: number) => {
      try {
        const res = await http(
          "DELETE",
          `/api/v1/client/cart/items/${productVariantId}`,
        );

        if (res?.success) {
          await fetchCart();
        }
      } catch (err) {
        console.error("Lỗi xoá sản phẩm trong giỏ:", err);
        throw err;
      }
    },
    [fetchCart],
  );

  const clearCart = useCallback(async () => {
    try {
      const res = await http("DELETE", "/api/v1/client/cart/all-items");
      if (res?.success) {
        setItems([]);
      }
    } catch (err) {
      console.error("Lỗi xoá sản phẩm trong giỏ:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    void fetchCart();
  }, [fetchCart]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      isLoading,
      fetchCart,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
    }),
    [
      items,
      totalItems,
      isLoading,
      fetchCart,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
