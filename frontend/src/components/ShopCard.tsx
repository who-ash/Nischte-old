import { MapPin, Phone, Plus, Minus, ShoppingCart } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

interface ShopCardProps {
  id: string;
  name: string;
  image: string;
  address: string;
  phone: string;
  onShopClick: (shopId: string) => void;
}

export function ShopCard({ id, name, image, address, phone, onShopClick }: ShopCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onShopClick(id)}
    >
      <AspectRatio ratio={16 / 9}>
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="object-cover w-full h-full"
        />
      </AspectRatio>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4" />
          {address}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Phone className="mr-1 h-4 w-4" />
          {phone}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Shop</Button>
      </CardFooter>
    </Card>
  );
}