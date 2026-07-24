export interface Item {
  shopId: any;
  _id: string;
  itemName: string;
  itemDescription: string;
  picture: string;
  offerId?: string[];
  price: number;
  item: string;
}

export interface CartItem extends Item {
  shopId: string;
  item: any;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
}

export type CartAction =
  | { type: "ADD_TO_CART"; payload: Item }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { _id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "CLEAR_ITEM"; payload: string }
