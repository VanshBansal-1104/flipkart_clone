import { create } from "zustand";
import { Product } from "@/data/products";
import { useAuthStore } from "@/store/authStore";
import { apiUrl } from "@/lib/apiBase";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  address: ShippingAddress;
  date: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
}

interface StoreState {
  cart: CartItem[];
  orders: Order[];
  wishlist: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (address: ShippingAddress) => Promise<string>;
  getCartTotal: () => number;
  getCartCount: () => number;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useStore = create<StoreState>((set, get) => ({
  cart: JSON.parse(localStorage.getItem("fk-cart") || "[]"),
  orders: JSON.parse(localStorage.getItem("fk-orders") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("fk-wishlist") || "[]"),

  addToCart: (product) => {
    set((state) => {
      const existing = state.cart.find((item) => item.product.id === product.id);
      const newCart = existing
        ? state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...state.cart, { product, quantity: 1 }];
      localStorage.setItem("fk-cart", JSON.stringify(newCart));
      return { cart: newCart };
    });
  },

  removeFromCart: (productId) => {
    set((state) => {
      const newCart = state.cart.filter((item) => item.product.id !== productId);
      localStorage.setItem("fk-cart", JSON.stringify(newCart));
      return { cart: newCart };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      const newCart =
        quantity <= 0
          ? state.cart.filter((item) => item.product.id !== productId)
          : state.cart.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            );
      localStorage.setItem("fk-cart", JSON.stringify(newCart));
      return { cart: newCart };
    });
  },

  clearCart: () => {
    localStorage.setItem("fk-cart", "[]");
    set({ cart: [] });
  },

  placeOrder: async (address) => {
    const state = get();
    if (state.cart.length === 0) {
      throw new Error("Cart is empty");
    }
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;

    let res: Response;
    try {
      res = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: state.cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          address,
          notifyEmail: user?.email ?? undefined,
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      throw new Error(
        `Could not reach the checkout API (${msg}). Keep npm run dev running and check the terminal for “API listening”.`,
      );
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string; orderId?: string; total?: number };
    if (!res.ok) {
      throw new Error(data.error || "Order failed");
    }

    const orderId = data.orderId as string;
    const total = typeof data.total === "number" ? data.total : state.getCartTotal();

    const order: Order = {
      id: orderId,
      items: [...state.cart],
      total,
      address,
      date: new Date().toISOString(),
    };
    const newOrders = [order, ...state.orders];
    localStorage.setItem("fk-orders", JSON.stringify(newOrders));
    localStorage.setItem("fk-cart", "[]");
    set({ orders: newOrders, cart: [] });
    return orderId;
  },

  getCartTotal: () => {
    return get().cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },

  getCartCount: () => {
    return get().cart.reduce((count, item) => count + item.quantity, 0);
  },

  toggleWishlist: (product) => {
    set((state) => {
      const exists = state.wishlist.some((p) => p.id === product.id);
      const newWishlist = exists
        ? state.wishlist.filter((p) => p.id !== product.id)
        : [...state.wishlist, product];
      localStorage.setItem("fk-wishlist", JSON.stringify(newWishlist));
      return { wishlist: newWishlist };
    });
  },

  isInWishlist: (productId) => {
    return get().wishlist.some((p) => p.id === productId);
  },
}));
