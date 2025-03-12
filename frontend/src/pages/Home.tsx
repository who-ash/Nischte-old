import { Navbar } from "../components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/utils/api";
import HeroSectionPic from "../assets/nischte-hero-pic.jpg";
import { SkeletonGrid } from "@/components/SkeletonGrid";
import { ShopCard } from "@/components/ShopCard";
import { ItemCard } from "@/components/ItemCard";

interface Shop {
  _id: string;
  shopName: string;
  address: string;
  contactNo: string;
  picture: string;
}

interface Item {
  _id: string;
  itemName: string;
  itemDescription: string;
  price: number;
  picture: string;
  shopId: string;
  offerId: string[];
}

export const Home = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { dispatch } = useCart();

  const fetchShopDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/v1/shop?limit=4`);
      setShops(res.data.shops);
      setLoading(false);
    } catch (error) {
      console.log("Failed to fetch the shop details", error);
      setShops([]);
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/v1/shop/menu?limit=4&page=1`);
      setItems(res.data.items);
      setLoading(false);
    } catch (error) {
      console.log("Failed to fetch the items", error);
      setItems([]);
      setLoading(false);
    }
  };

  const handleShopClick = (shopId: string) => {
    try {
      navigate(`/shop/${shopId}`);
    } catch (error) {
      console.log("Failed to navigate to shop details");
      toast.error("Failed to open shop details");
    }
  };

  const handleItemClick = (itemId: string, shopId: string) => {
    try {
      navigate(`/shop/${shopId}/menu/${itemId}`);
    } catch (error) {
      console.log("Failed to navigate to item details");
      toast.error("Failed to open item details");
    }
  };

  const handleAddToCart = (item: any, quantity: number) => {
    try {
      console.log("item", item);
      for (let i = 0; i < quantity; i++) {
        dispatch({
          type: "ADD_TO_CART",
          payload: { 
            ...item,
            offerId: item.offerId,
            itemName: item.name,
            _id: item.id
          },
        });
      }
      toast.success(`${quantity} x ${item.name} added to your cart`, {
        duration: 2000,
      });
    } catch (error) {
      console.log("Failed to add item to cart", error);
      toast.error("Failed to add item to cart");
    }
  };

  useEffect(() => {
    fetchShopDetails();
    fetchItems();
  }, []);

  return (
    <div className="px-6 md:px-[200px] flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-8 md:py-12 px-6 md:px-12 relative z-10">
            <div className="w-full md:w-[70%] space-y-4 md:space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Put Loyalty <span className="text-blue-600">First</span>
              </h1>
              <div className="space-y-3">
                <h3 className="text-xl md:text-2xl text-gray-700 font-medium">
                  Bridging the Gap Between Customers and Businesses!
                </h3>
                <h3 className="text-lg md:text-xl text-gray-600">
                  Where Customers Win and Businesses Thrive!
                </h3>
              </div>
            </div>
            <div className="w-full md:w-[30%] mt-6 md:mt-0">
              <img
                src={HeroSectionPic}
                alt="Hero Section"
                className="w-full object-contain transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100 rounded-full -mr-24 -mt-24 opacity-50" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full -ml-16 -mb-16 opacity-50" />
        </div>

        {/* Shop Section */}
        <div className="flex justify-between">
          <h1 className="font-extrabold text-black mb-4 text-2xl">Shops</h1>
          <Button 
            className="cursor-pointer" 
            onClick={() => navigate("/shops")}
          >
            View more
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-4">
          {loading ? (
            <SkeletonGrid count={4} />
          ) : (
            shops.map((shop) => (
              <ShopCard
                key={shop._id}
                id={shop._id}
                name={shop.shopName}
                image={shop.picture}
                address={shop.address}
                phone={shop.contactNo}
                onShopClick={handleShopClick}
              />
            ))
          )}
        </div>

        {/* Items Section */}
        <div className="flex justify-between mt-8">
          <h1 className="font-extrabold text-black mb-4 text-2xl">New In Store</h1>
          <Button 
            className="cursor-pointer" 
            onClick={() => navigate("/items")}
          >
            View more
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-4">
          {loading ? (
            <SkeletonGrid count={4} />
          ) : (
            items.map((item) => (
              <ItemCard
                key={item._id}
                id={item._id}
                shopId={item.shopId}
                name={item.itemName}
                image={item.picture}
                currency="₹"
                price={item.price}
                onItemClick={handleItemClick}
                onAddToCart={handleAddToCart}
              />
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};