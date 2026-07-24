  import { FC, useEffect, useState } from "react";
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
  import { 
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { toast } from "sonner";
  import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
  import axios from "axios";
  import { API } from "@/utils/api";
  import { useAuth, useUser } from "@clerk/clerk-react";
  import {
    MdOutlineAddCircleOutline,
    MdOutlineManageHistory,
  } from "react-icons/md";
  import { FaPen } from "react-icons/fa";
  import { MdDelete } from "react-icons/md";
  import { Navbar } from "@/components/Navbar";
  import { Footer } from "@/components/Footer";
  import { useCart } from "@/context/CartContext";
  import { SkeletonGrid } from "@/components/SkeletonGrid";
  import { IoMdEye } from "react-icons/io";
  import { ShopCard } from "@/components/ShopCard";
  import ShopBanner from "@/components/shopBanner";
  import { ItemCard } from "@/components/ItemCard";

  interface Shop {
    _id: string;
    shopName: string;
    address: string;
    contactNo: string;
    picture: string;
    ownerId: string;
  }

  interface Item {
    _id: string;
    itemName: string;
    itemDescription: string;
    offerId?: string;
    picture: string;
    price: string;
  }

  export const ShopDetails: FC = () => {
    const [shop, setShop] = useState<Shop>();
    const [otherShops, setOtherShops] = useState<Shop[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [charLimit, setCharLimit] = useState(70);
    const [loading, setLoading] = useState<Boolean>(false);

    const { dispatch } = useCart();
    const { getToken } = useAuth();
    const { user } = useUser();
    const { shopId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const isManagePage = location.pathname.includes("/shop/manage");

    const fetchShopDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/v1/shop/${shopId}`);
        setShop(res?.data?.shop);
      } catch (error) {
        console.log("Failed to get the shop details");
      } finally {
        setLoading(false);
      }
    };

    const fetchOtherShops = async () => {
      if (!isManagePage) {
        try {
          const res = await axios.get(`${API}/api/v1/shop?limit=4`);
          setOtherShops(res.data.shops.filter((s: Shop) => s._id !== shopId));
        } catch (error) {
          console.log("Failed to fetch other shops");
          setOtherShops([]);
        }
      }
    };

    const handleDeleteShop = async () => {
      try {
        const token = await getToken();
        await axios.delete(`${API}/api/v1/shop/${shopId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        toast.success("Shop deleted successfully!");
        navigate("/shop/manage");
      } catch (error) {
        console.log("Failed to delete shop");
        toast.error("Failed to delete shop. Please try again.");
      }
    };

    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/v1/shop/${shopId}/menu`);
        setItems(res.data[0].items);
      } catch (error) {
        console.log("Failed to fetch the menu items");
      } finally {
        setLoading(false);
      }
    };

    const handleItemClick = (menuId: string) => {
      navigate(`/shop/${shopId}/menu/${menuId}`);
    };

    const handleAddToCart = (item: any, quantity: number) => {
      dispatch({ 
        type: 'ADD_TO_CART', 
        payload: { 
          ...item, 
          quantity 
        } 
      });
    };

    const handleDeleteItem = async (itemId: string) => {
      try {
        const token  = await getToken();
        await axios.delete(`${API}/api/v1/shop/${shopId}/menu/${itemId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        toast.success("Item deleted successfully!");
        setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));
      } catch (error) {
        console.log("Failed to delete the item");
        toast.error("Failed to delete item. Please try again.");
      }
    };

    const handleItemUpdate = (menuId: string) => {
      navigate(`/shop/${shopId}/menu/${menuId}/update`);
    };

    const handleOfferBtnClick = async (menuId: string) => {
      try {
        navigate(`/shop/${shopId}/menu/${menuId}/offer`);
      } catch (error) {
        console.log("Failed to handle offer click");
      }
    };

    const updateCharLimit = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCharLimit(70);
      } else if (width >= 640 && width < 1024) {
        setCharLimit(70);
      } else {
        setCharLimit(200);
      }
    };

    const handleShopClick = (shopId: string) => {
      navigate(`/shop/${shopId}`);
    };

    useEffect(() => {
      fetchShopDetails();
      fetchMenuItems();
    }, []);

    useEffect(() => {
      updateCharLimit();
      window.addEventListener("resize", updateCharLimit);
      return () => {
        window.removeEventListener("resize", updateCharLimit);
      };
    }, []);

    useEffect(() => {
      fetchOtherShops();
    }, [shopId]);

    return (
      <div className="px-6 md:px-[200px] flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow">
          <nav className="flex flex-col lg:flex-row items-center justify-between">
            <h1 className="font-extrabold text-black flex justify-center mt-4 mb-4 text-4xl">
              {shop?.shopName}
            </h1>
            {user?.id === shop?.ownerId && isManagePage && (
              <div className="flex flex-wrap sm:flex-none gap-4 mt-2 mb-4 justify-center">
                <Link to={`/shop/${shopId}/add-menu`}>
                  <Button className="space-x-2">
                    <MdOutlineAddCircleOutline size={18} />
                    <p>Item</p>
                  </Button>
                </Link>

                <Link to={`/shop/update/${shopId}`}>
                  <Button className="space-x-2">
                    <FaPen size={18} /> <p>Shop</p>
                  </Button>
                </Link>

                <Link to={`/shop/orders/${shopId}`}>
                  <Button className="space-x-2">
                    <IoMdEye size={18} /> <p>Orders</p>
                  </Button>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="space-x-2">
                      <MdDelete size={18} /> <p>Delete Shop</p>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to delete this Shop?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        your shop and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteShop}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </nav>

          {/* Shop Display */}
          {loading ? (
            <SkeletonGrid count={1} />
          ) : (
            shop && (
              <ShopBanner
                shopName={shop.shopName}
                phoneNumber={shop.contactNo}
                address={shop.address}
                imageUrl={shop.picture}
              />
            )
          )}

          {/* Items Display */}
          <h1 className="font-extrabold text-black mt-4 mb-4 text-lg">
            In The House
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              <SkeletonGrid count={4} />
            ) : (
              items.map((item) => (
                <ItemCard
                  key={item._id}
                  id={item._id}
                  shopId={shopId || ''}
                  name={item.itemName}
                  image={item.picture}
                  price={parseFloat(item.price)}
                  currency="₹"
                  isManagePage={isManagePage}
                  isOwner={shop?.ownerId === user?.id}
                  onUpdate={handleItemUpdate}
                  onOffer={handleOfferBtnClick}
                  onDelete={handleDeleteItem}
                  onItemClick={handleItemClick}
                  onAddToCart={handleAddToCart}
                />
              ))
            )}
          </div>

          {/* Other Shops Section */}
          {!isManagePage && (
            <>
              <h1 className="font-extrabold text-black mt-8 mb-4 text-lg">
                Other Shops You Might Like
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {loading ? (
                  <SkeletonGrid count={4} />
                ) : (
                  otherShops.map((shop) => (
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
            </>
          )}
        </div>
        <Footer />
      </div>
    );
  };

  export default ShopDetails;