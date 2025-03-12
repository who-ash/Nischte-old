import { CartAction, CartItem, CartState } from "@/types/Cart";

export const cartReducer = (
  state: CartState,
  action: CartAction
): CartState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      
      const existingShopId = state.items.length > 0 ? state.items[0].shopId : null;
    
      let newItems: CartItem[];
      if (existingShopId && existingShopId !== action.payload.shopId) {
        // If adding from a different shop, replace cart with the new item
        newItems = [
          {
            ...action.payload,
            quantity: 1,
            shopId: action.payload.shopId,
            offerId: action.payload.offerId || [], // Ensure offerId is included
          },
        ];
      } else {
        // If same shop, add or update the item
        const existingItemIndex = state.items.findIndex(
          (item) => item._id === action.payload._id
        );
    
        if (existingItemIndex >= 0) {
          newItems = state.items.map((item, index) =>
            index === existingItemIndex
              ? { 
                  ...item, 
                  quantity: item.quantity + 1,
                  offerId: item.offerId || action.payload.offerId || [], // Preserve or set offerId
                }
              : item
          );
        } else {
          newItems = [
            ...state.items,
            {
              ...action.payload,
              quantity: 1,
              shopId: action.payload.shopId,
              offerId: action.payload.offerId || [], // Ensure offerId is included
            },
          ];
        }
      }
      
      console.log("New items after ADD_TO_CART:", newItems);
    
      const newTotal = newItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    
      return {
        items: newItems,
        total: newTotal,
      };
    }
    
    case "REMOVE_FROM_CART": {
      console.log("REMOVE_FROM_CART action payload:", action.payload);
      
      const newItems = state.items.filter(
        (item) => item._id !== action.payload
      );
      
      console.log("Items after removal:", newItems);
      
      const newTotal = newItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return {
        items: newItems,
        total: newTotal,
      };
    }

    case "UPDATE_QUANTITY": {
      console.log("UPDATE_QUANTITY action payload:", action.payload);
      
      const newItems = state.items.map((item) =>
        item._id === action.payload._id
          ? { 
              ...item, 
              quantity: action.payload.quantity,
              offerId: item.offerId || [], // Preserve offerId during quantity update
            }
          : item
      );
      
      console.log("Items after quantity update:", newItems);

      const newTotal = newItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return {
        items: newItems,
        total: newTotal,
      };
    }

    case "LOAD_CART": {
      console.log("LOAD_CART action payload:", action.payload);
      
      const total = action.payload.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      
      // Ensure each item has offerId array
      const items = action.payload.map(item => ({
        ...item,
        offerId: item.offerId || [],
      }));
      
      console.log("Cart after loading:", items);
      
      return {
        items,
        total,
      };
    }

    case "CLEAR_ITEM": {
      console.log("CLEAR_ITEM action payload:", action.payload);
      
      const newItems = state.items.filter(
        (item) => item._id !== action.payload
      );
      
      console.log("Items after clearing:", newItems);
      
      const newTotal = newItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return {
        items: newItems,
        total: newTotal,
      };
    }

    default:
      return state;
  }
};