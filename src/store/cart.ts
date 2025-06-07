import { create } from "zustand";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

type AddToCartItem = Omit<CartItem, "quantity">;

interface cartState {
  items: CartItem[];
  addToCart: (newItem: AddToCartItem) => void;
  clearCart: () => void;
}

export const useCartStore = create<cartState>()((set) => ({
  items: [],
  addToCart: (newItem) => {
    set((currentState) => {
      const duplicateItems = [...currentState.items];

      const existingItemIndex = duplicateItems.findIndex(
        (item) => item.productId === newItem.productId,
      );
      // If the items not found, add it with quantity 1
      if (existingItemIndex === -1) {
        duplicateItems.push({
          productId: newItem.productId,
          name: newItem.name,
          imageUrl: newItem.imageUrl,
          price: newItem.price,
          quantity: 1,
        });
      } else {
        const itemToUpdate = duplicateItems[existingItemIndex];

        if (!itemToUpdate) return currentState;

        itemToUpdate.quantity += 1;
      }

      return {
        ...currentState,
        items: duplicateItems,
      };
    });
  },
  clearCart: () => {
    set((currentState) => {
      return {
        ...currentState,
        items: [],
      };
    });
  },
}));
//currying
