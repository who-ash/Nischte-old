import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface ItemBannerProps {
  id: string;
  shopId: string;
  description: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  onAddToCart: (item: any, quantity: number) => void;
}

const ItemBanner: React.FC<ItemBannerProps> = ({ id, shopId, name, image, price, currency, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (value: string) => {
    const newValue = Number.parseInt(value);
    if (!isNaN(newValue) && newValue >= 1 && newValue <= 99) {
      setQuantity(newValue);
    }
  };

  const handleQuantityBlur = () => {
    if (quantity < 1) {
      setQuantity(1);
      toast.error("Please enter a valid quantity");
    }
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    onAddToCart({ id, shopId, name, price, image }, quantity);
    toast.success(`${quantity} x ${name} added to your cart`, { duration: 2000 });
  };

  return (
    <div className="flex flex-col md:flex-row bg-white rounded-lg overflow-hidden shadow-lg w-full">
      <div className="w-full md:w-1/3 h-72 overflow-hidden">
        <img src={image || "/placeholder.svg"} alt={name} className="w-full h-full object-cover object-center" />
      </div>
      <div className="w-full md:w-2/3 p-5 md:p-10 flex flex-col justify-center text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{name}</h1>
        <p className="text-2xl md:text-3xl font-bold text-gray-600 mb-5">{currency}{price}</p>
        <div className="flex justify-center md:justify-start items-center mb-5">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleUpdateQuantity(quantity - 1)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onBlur={handleQuantityBlur}
            className="w-16 h-10 text-center mx-2"
            min={1}
            max={99}
          />
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleUpdateQuantity(quantity + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button className="w-full md:w-72 self-center md:self-start" onClick={handleAddToCart}>
          <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ItemBanner;
