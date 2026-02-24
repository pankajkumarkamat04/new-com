"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cartApi } from "@/lib/api";
import type { CartItem } from "@/lib/types";

const CART_STORAGE_KEY = "guest_cart";

type CartContextType = {
  items: CartItem[];
  count: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number, product?: { name: string; price: number; image?: string }) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  mergeGuestCartThenRefresh: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

function loadGuestCart(): { productId: string; quantity: number; product?: { name: string; price: number; image?: string } }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: { productId: string; quantity: number; product?: { name: string; price: number; image?: string } }[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isLoggedIn = mounted && !!localStorage.getItem("token") && localStorage.getItem("userType") === "user";

  const refreshCart = useCallback(async () => {
    if (!mounted) return;
    if (!isLoggedIn) {
      const guest = loadGuestCart();
      setItems(
        guest.map((g) => ({
          productId: g.productId,
          quantity: g.quantity,
          product: g.product
            ? { _id: g.productId, name: g.product.name, price: g.product.price, image: g.product.image, isActive: true, stock: 999 }
            : undefined,
        }))
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await cartApi.get();
    setLoading(false);
    if (res.data?.data?.items) setItems(res.data.data.items);
    else setItems([]);
  }, [mounted, isLoggedIn]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refreshCart();
  }, [mounted, isLoggedIn, refreshCart]);

  const addToCart = useCallback(
    async (productId: string, quantity = 1, product?: { name: string; price: number; image?: string }) => {
      if (!mounted) return;
      const qty = Math.max(1, quantity);
      if (!isLoggedIn) {
        const guest = loadGuestCart();
        const existing = guest.find((g) => g.productId === productId);
        if (existing) {
          existing.quantity += qty;
        } else {
          guest.push({ productId, quantity: qty, product });
        }
        saveGuestCart(guest);
        setItems(
          guest.map((g) => ({
            productId: g.productId,
            quantity: g.quantity,
            product: g.product
              ? { _id: g.productId, name: g.product.name, price: g.product.price, image: g.product.image, isActive: true, stock: 999 }
              : undefined,
          }))
        );
        return;
      }
      const res = await cartApi.add(productId, qty);
      if (res.data?.data?.items) setItems(res.data.data.items);
    },
    [mounted, isLoggedIn]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!mounted) return;
      if (!isLoggedIn) {
        const guest = loadGuestCart();
        const idx = guest.findIndex((g) => g.productId === productId);
        if (idx >= 0) {
          if (quantity <= 0) guest.splice(idx, 1);
          else guest[idx].quantity = quantity;
          saveGuestCart(guest);
          setItems(
            guest.map((g) => ({
              productId: g.productId,
              quantity: g.quantity,
              product: g.product
                ? { _id: g.productId, name: g.product.name, price: g.product.price, image: g.product.image, isActive: true, stock: 999 }
                : undefined,
            }))
          );
        }
        return;
      }
      const res = await cartApi.update(productId, quantity);
      if (res.data?.data?.items) setItems(res.data.data.items);
    },
    [mounted, isLoggedIn]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (!mounted) return;
      if (!isLoggedIn) {
        const guest = loadGuestCart().filter((g) => g.productId !== productId);
        saveGuestCart(guest);
        setItems(
          guest.map((g) => ({
            productId: g.productId,
            quantity: g.quantity,
            product: g.product
              ? { _id: g.productId, name: g.product.name, price: g.product.price, image: g.product.image, isActive: true, stock: 999 }
              : undefined,
          }))
        );
        return;
      }
      const res = await cartApi.remove(productId);
      if (res.data?.data?.items) setItems(res.data.data.items);
      else setItems([]);
    },
    [mounted, isLoggedIn]
  );

  const mergeGuestCartThenRefresh = useCallback(async () => {
    const guest = loadGuestCart();
    if (guest.length === 0) {
      clearGuestCart();
      await refreshCart();
      return;
    }
    const res = await cartApi.merge(guest.map((g) => ({ productId: g.productId, quantity: g.quantity })));
    clearGuestCart();
    if (res.data?.data?.items) setItems(res.data.data.items);
    else await refreshCart();
  }, [refreshCart]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        mergeGuestCartThenRefresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
