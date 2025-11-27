import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { http, tokenStore } from "../services/http";
import { useAuth } from "./AuthContext";

// =======================
// TYPES
// =======================

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product?: {
    id: number;
    title: string;
    price: number | null;
    discountPercentage?: number; // Thêm trường này
    thumbnail: string | null;
    slug: string | null;
  } | null;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  isLoading: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (productId: number, qty?: number) => Promise<void>;
  updateItem: (productId: number, qty: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => void;
}

// =======================
// CONTEXT INIT
// =======================

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

// =======================
// PROVIDER
// =======================

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // =======================
  // Fetch cart from backend
  // =======================
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await http("GET", "/api/v1/client/cart");
      if (res?.success && Array.isArray(res.data)) {
        setItems(res.data);
      }
    } catch (err) {
      console.error("Lỗi load giỏ hàng:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // =======================
  // Add to cart
  // =======================
  const addToCart = async (productId: number, qty: number = 1) => {
    if (!isAuthenticated) {
      // client chưa login → không dispatch, chỉ return
      // header đã điều hướng login rồi
      return;
    }

    try {
      const res = await http("POST", "/api/v1/client/cart/items", {
        productId,
        quantity: qty,
      });

      if (res.success && res.data) {
        // đồng bộ lại toàn cart
        await fetchCart();
      }
    } catch (err) {
      console.error("Lỗi thêm vào giỏ hàng:", err);
    }
  };

  // =======================
  // Update item quantity
  // =======================
  const updateItem = async (productId: number, qty: number) => {
    try {
      const res = await http(
        "PATCH",
        `/api/v1/client/cart/items/${productId}`,
        { quantity: qty }
      );

      if (res.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error("Lỗi cập nhật giỏ hàng:", err);
    }
  };

  // =======================
  // Remove from cart
  // =======================
  const removeItem = async (productId: number) => {
    try {
      const res = await http(
        "DELETE",
        `/api/v1/client/cart/items/${productId}`
      );

      if (res.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error("Lỗi xoá sản phẩm trong giỏ:", err);
    }
  };

  // =======================
  // Clear cart on logout
  // =======================
  const clearCart = () => {
    setItems([]);
  };

  // =======================
  // Auto-load cart khi:
  // - user login xong
  // - trang được reload và accessToken vẫn còn
  // =======================
  useEffect(() => {
    if (!tokenStore.getAccess()) {
      setItems([]);
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        isLoading,
        fetchCart,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
