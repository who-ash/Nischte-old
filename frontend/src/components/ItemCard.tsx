import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Button } from "./ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Input } from "./ui/input";
import { useState } from "react";

interface ItemCardProps {
  id: string;
  shopId: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  isManagePage?: boolean;
  description ?: string;
  isOwner ?: boolean;
  offerId?: string[];
  onUpdate?: (menuId: string) => void
  onOffer?: (menuId: string) => Promise<void>
  onDelete?: (itemId: string) => Promise<void>
  onItemClick: (itemId: string, shopId: string) => void;
  onAddToCart: (item: any, quantity: number) => void;
}

export function ItemCard({ 
  id, 
  shopId,
  name, 
  image, 
  price, 
  currency,
  isManagePage,
  isOwner,
  offerId,
  onItemClick,
  onAddToCart,
  onUpdate,
  onOffer,
  onDelete
}: ItemCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (value: string) => {
    const newValue = parseInt(value);
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const itemData = {
      id,
      shopId,
      name,
      price,
      image,
      offerId 
    };
    onAddToCart(itemData, quantity);
    toast.success(`${quantity} x ${name} added to your cart`, { duration: 2000 });
  };

  return (
    <Card 
      className={`overflow-hidden transition-shadow hover:shadow-md cursor-pointer ${isManagePage ? 'border border-gray-300' : ''}`}
      onClick={!isManagePage ? () => onItemClick(id, shopId) : undefined}
    >
      <AspectRatio ratio={16 / 9}>
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover"
        />
      </AspectRatio>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2 truncate">{name}</h3>
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-semibold">
            {currency}
            {price}
          </span>
          {!isManagePage && (
            <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleUpdateQuantity(quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={handleQuantityBlur}
                className="w-12 h-8 text-center p-0"
                min={1}
                max={99}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleUpdateQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Manage Page Actions */}
        {isManagePage && isOwner ? (
          <div className="flex justify-around items-center gap-2 mt-2">
            <Button size="sm" className="w-full" onClick={() => onUpdate?.(id)}>
              Edit
            </Button>
            <Button size="sm" className="w-full" onClick={() => onOffer?.(id)}>
              Offer
            </Button> 
            <Button variant="destructive" className="w-full" size="sm" onClick={() => onDelete?.(id)}>
              Delete
            </Button>
          </div>
        ) : (
          // Add to Cart Button
          <Button className="w-full mt-2" onClick={handleAddToCart} disabled={isManagePage}>
            <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

