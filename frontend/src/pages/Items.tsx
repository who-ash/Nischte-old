import { FC, useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { SkeletonGrid } from "@/components/SkeletonGrid";
import { useCart } from "@/context/CartContext";
import { ItemCard } from "@/components/ItemCard";
import { toast } from "sonner";

interface Item {
  _id: string;
  itemName: string;
  itemDescription: string;
  price: number;
  picture: string;
  offerId: string[]; 
  shopId: string;
  item: string;
}

interface ItemResponse {
  items: Item[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const Items: FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(16);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const { dispatch } = useCart();
  const navigate = useNavigate();

  const fetchItems = useCallback(async (currentPage: number, search: string = "") => {
    try {
      setLoading(true);
      const res = await axios.get<ItemResponse>(
        `${API}/api/v1/shop/menu?page=${currentPage}&limit=${itemsPerPage}&search=${search}`
      );
      console.log("here: ggg ", res.data);
      if (currentPage === 1) {
        setItems(res.data.items);
      } else {
        setItems((prev) => [...prev, ...res.data.items]);
      }

      setTotal(res.data.pagination.totalItems);
      setHasMore(res.data.pagination.hasNextPage);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch items", error);
      setLoading(false);
    }
  }, [itemsPerPage]);

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      setPage(1);
      fetchItems(1, searchQuery);
    }, 300),
    [fetchItems]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    debouncedSearch(query);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchItems(nextPage, searchTerm);
    }
  };

  const handleItemClick = (itemId: string, shopId: string) => {
    try {
      navigate(`/shop/${shopId}/menu/${itemId}`);
    } catch (error) {
      console.log("Failed to get item details");
      toast.error("Failed to open item details");
    }
  };

  const handleAddToCart = (item: any, quantity: number) => {
    // Find the original item data from the items state
    const originalItem = items.find(i => i._id === item._id);
    
    if (!originalItem) {
      console.error('Item not found');
      return;
    }
  
    const cartItem = {
      _id: originalItem._id,
      itemName: originalItem.itemName,
      price: originalItem.price,
      picture: originalItem.picture,
      offerId: originalItem.offerId, // This will now have the correct offerId array
      shopId: originalItem.shopId,
      itemDescription: originalItem.itemDescription,
      item: originalItem._id,
      quantity: 1
    };
  
    for (let i = 0; i < quantity; i++) {
      console.log("items at items: ", cartItem);
      dispatch({ type: "ADD_TO_CART", payload: cartItem });
    }
  };

  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  const shouldShowViewMore = !searchTerm && hasMore && items.length < total;

  return (
    <div className="px-6 md:px-[200px] flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <div className="my-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-extrabold text-black text-2xl">Items</h1>
            <div className="w-1/3">
              <Input
                type="text"
                placeholder="Search by items..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full"
              />
            </div>
          </div>

          {items.length === 0 && !loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No items found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  <SkeletonGrid count={items.length} />
                ) : (
                  items.map((item) => (
                    <ItemCard
                      key={item._id}
                      id={item._id}
                      shopId={item.shopId}
                      name={item.itemName}
                      image={item.picture}
                      price={item.price}
                      offerId={item.offerId} 
                      currency="₹"
                      onItemClick={handleItemClick}
                      onAddToCart={(_, quantity) => handleAddToCart(item, quantity)} // Modified this line
                    />
                  ))
                )}
              </div>

              {shouldShowViewMore && (
                <div className="flex justify-center my-4">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    className="text-xs sm:text-base"
                  >
                    {loading ? "Loading..." : "View More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};