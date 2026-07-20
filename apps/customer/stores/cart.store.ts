import { create } from 'zustand';
import type { IMenuItem } from '../types';

interface CartItem {
  menuItem: IMenuItem;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: IMenuItem, restaurantId: string, restaurantName: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  restaurantId: null,
  restaurantName: null,

  addItem: (menuItem, restaurantId, restaurantName) => {
    const state = get();
    if (state.restaurantId && state.restaurantId !== restaurantId) return;
    const existing = state.items.find((i) => i.menuItem.id === menuItem.id);
    if (existing) {
      set({
        items: state.items.map((i) =>
          i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({
        items: [...state.items, { menuItem, quantity: 1, restaurantId, restaurantName }],
        restaurantId,
        restaurantName,
      });
    }
  },

  removeItem: (menuItemId) => {
    const state = get();
    const newItems = state.items.filter((i) => i.menuItem.id !== menuItemId);
    set({
      items: newItems,
      restaurantId: newItems.length === 0 ? null : state.restaurantId,
      restaurantName: newItems.length === 0 ? null : state.restaurantName,
    });
  },

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.menuItem.id === menuItemId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),
}));
