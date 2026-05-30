"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  ids: string[];
  toggle: (productId: string) => void;
  setIds: (ids: string[]) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (productId) => set((state) => ({ ids: state.ids.includes(productId) ? state.ids.filter((id) => id !== productId) : [...state.ids, productId] })),
      setIds: (ids) => set({ ids })
    }),
    { name: "gridstores-wishlist" }
  )
);
