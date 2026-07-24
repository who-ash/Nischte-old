import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FaMinus, FaPlus } from "react-icons/fa";
import { ImCancelCircle } from "react-icons/im";
import axios from "axios";
import { API } from "@/utils/api";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

// Skeleton Components
const CartItemSkeleton = () => (
  <Card className="p-4">
    <div className="flex items-start gap-4">
      <Skeleton className="w-20 h-20 rounded" />
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-6 w-6" />
        </div>
        <Skeleton className="h-6 w-20 mb-2" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  </Card>
);

const OfferSkeleton = () => (
  <Card className="p-4 min-h-[100px]"> {/* Adjust height based on content */}
    <div className="flex items-center space-x-2">
      <Skeleton className="h-4 w-4 rounded-full" />
      <div className="flex-grow">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-1" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  </Card>
);


const OrderSummarySkeleton = () => (
  <Card className="p-4 sticky top-4">
    <Skeleton className="h-6 w-32 mb-4" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="mb-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-3 w-32 mt-1" />
      </div>
    ))}
    <div className="border-t mt-4 pt-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
    <Skeleton className="h-9 w-full mt-4" />
  </Card>
);

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Cart = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id;

  const { state, dispatch } = useCart();
  const [quantities, setQuantities] = useState<{ [key: string]: string }>({});
  const [_, setApplicableOffers] = useState([]);
  const [offerDetails, setOfferDetails] = useState([]);
  const [selectedOffers, setSelectedOffers] = useState<{
    [key: string]: string;
  }>({});
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  const handleQuantityChange = (itemId: string, value: string) => {
    setQuantities({ ...quantities, [itemId]: value });
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      dispatch({ type: "REMOVE_FROM_CART", payload: itemId });
      toast.success("Item removed from cart");
      return;
    }

    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { _id: itemId, quantity: newQuantity },
    });
  };

  const handleQuantityBlur = (itemId: string, currentQuantity: number) => {
    const inputValue = quantities[itemId];
    if (!inputValue) {
      setQuantities((prev) => ({
        ...prev,
        [itemId]: currentQuantity.toString(),
      }));
      return;
    }

    const newQuantity = parseInt(inputValue);
    if (isNaN(newQuantity) || newQuantity < 1) {
      setQuantities((prev) => ({
        ...prev,
        [itemId]: currentQuantity.toString(),
      }));
      toast.error("Please enter a valid quantity");
      return;
    }

    handleUpdateQuantity(itemId, newQuantity);
  };

  const fetchOfferDetails = async () => {
    setIsLoadingOffers(true);
    try {
      const token = await getToken();
      const offerIds = Array.from(
        new Set(
          state.items
            .filter((item) => (item.offerId ?? []).length > 0)
            .flatMap((item) => item.offerId)
        )
      );

      if (offerIds.length === 0) {
        setApplicableOffers([]);
        setOfferDetails([]);
        return;
      }

      const eligibleResponse = await axios.post(
        `${API}/api/v1/offer/eligible`,
        {
          offerIds: offerIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (eligibleResponse.data.success) {
        const eligibleOffers = eligibleResponse.data.applicableOffers;
        setApplicableOffers(eligibleOffers);

        if (eligibleOffers.length > 0) {
          const eligibleOfferIds = eligibleOffers
            .map((offer: { offerId: any }) => offer.offerId)
            .join(",");
          const detailsResponse = await axios.get(
            `${API}/api/v1/offer/applicable`,
            {
              params: { offerId: eligibleOfferIds },
            }
          );
          if (detailsResponse.data.offers) {
            setOfferDetails(detailsResponse.data.offers);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Error loading offers");
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const handleOfferSelection = (itemId: string, offerId: string) => {
    setSelectedOffers({});
    if (offerId) {
      setSelectedOffers({ [itemId]: offerId });
      toast.success("Offer applied successfully");
    }
  };

  const calculateItemPrice = (item: any) => {
    const selectedOfferId = selectedOffers[item._id as string];
    if (!selectedOfferId) {
      return {
        originalPrice: item.price * item.quantity,
        finalPrice: item.price * item.quantity,
        savings: 0,
        totalItems: item.quantity,
        appliedOffer: null,
      };
    }

    const selectedOffer = offerDetails.find(
      (offer: {
        _id: string;
        offerDescription: {
          discountRate?: number;
          plusOffers?: number;
          description: string;
        };
      }) => offer._id === selectedOfferId
    ) as
      | {
          offerType: any;
          _id: string;
          offerDescription: {
            discountRate?: number;
            plusOffers?: number;
            description: string;
          };
        }
      | undefined;

    if (!selectedOffer)
      return {
        originalPrice: item.price * item.quantity,
        finalPrice: item.price * item.quantity,
        savings: 0,
        totalItems: item.quantity,
        appliedOffer: null,
      };

    const offerDescription: {
      discountRate?: number;
      plusOffers?: number;
      description: string;
    } = selectedOffer.offerDescription;
    let finalPrice = item.price * item.quantity;
    let totalItems = item.quantity;

    if (offerDescription.discountRate) {
      finalPrice =
        item.price * item.quantity * (1 - offerDescription.discountRate / 100);
    }

    if (offerDescription.plusOffers) {
      totalItems = item.quantity + offerDescription.plusOffers;
    }

    return {
      originalPrice: item.price * item.quantity,
      finalPrice,
      savings: item.price * item.quantity - finalPrice,
      appliedOffer: selectedOffer,
      totalItems,
    };
  };

  const calculateCartTotal = () => {
    return state.items.reduce((total, item) => {
      const priceDetails = calculateItemPrice(item);
      return total + priceDetails.finalPrice;
    }, 0);
  };

  const generateOrderSummary = () => {
    const summary = {
      items: state.items.map((item) => {
        const priceDetails = calculateItemPrice(item);
        return {
          itemId: item._id,
          itemName: item.itemName,
          shopId: item.shopId,
          quantity: item.quantity,
          basePrice: item.price,
          totalItems: priceDetails.totalItems,
          originalPrice: priceDetails.originalPrice,
          finalPrice: priceDetails.finalPrice,
          savings: priceDetails.savings,
          appliedOffer: priceDetails.appliedOffer
            ? {
                offerId: priceDetails.appliedOffer._id,
                offerName: priceDetails.appliedOffer.offerType.name,
                description:
                  priceDetails.appliedOffer.offerDescription.description,
                ...(priceDetails.appliedOffer.offerDescription?.discountRate !==
                  undefined && {
                  discountRate:
                    priceDetails.appliedOffer.offerDescription.discountRate,
                }),
                ...(priceDetails.appliedOffer.offerDescription?.plusOffers !==
                  undefined && {
                  plusOffer:
                    priceDetails.appliedOffer.offerDescription.plusOffers,
                }),
              }
            : null,
        };
      }),
      cartTotal: calculateCartTotal(),
      totalSavings: state.items.reduce((total, item) => {
        const priceDetails = calculateItemPrice(item);
        return total + priceDetails.savings;
      }, 0),
      totalItems: state.items.reduce((total, item) => {
        const priceDetails = calculateItemPrice(item);
        return total + priceDetails.totalItems;
      }, 0),
      originalQuantity: state.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      userId,
    };

    localStorage.setItem("orderSummary", JSON.stringify(summary));
    return summary;
  };

  const handleCheckout = async () => {
    const orderSummary = generateOrderSummary();
    const { cartTotal } = orderSummary;
    
    try {
      const token = await getToken();
      const plainData = JSON.stringify({
        amount: cartTotal,
        timeStamp: Date.now()
      });
  
      const response = await axios.get(
        `${API}/api/v1/payment/initiate?data=${encodeURIComponent(plainData)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.data.success) {
        const paymentInfo = {
          transactionId: response.data.merchantTransactionId,
          paymentData: response.data.data,
          timestamp: Date.now()
        };
        
        // Store as a single item
        localStorage.setItem('paymentInfo', JSON.stringify(paymentInfo));
        
        let redirectUrl = response.data.redirectUrl;
        if (redirectUrl && !redirectUrl.startsWith('http')) {
          redirectUrl = `https://${redirectUrl}`;
        }
        window.location.href = response.data.redirectUrl;

      }else {
        localStorage.removeItem('currentTransactionId');
        toast.error("Payment initiation failed");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed");
    }
  };

  const handleItemCancel = (itemId: string) => {
    dispatch({
      type: "CLEAR_ITEM",
      payload: itemId,
    });
  };

  useEffect(() => {
    // Simulate loading state for cart items
    setIsLoadingCart(true);
    setTimeout(() => setIsLoadingCart(false), 200);
    
    fetchOfferDetails();
  }, [state.items]);

  return (
    <div className="min-h-screen flex flex-col px-6 md:px-[200px]">
      <Navbar />
      <div className="flex-grow">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="flex-grow space-y-8">
            {/* Cart Items */}
            <div className="space-y-4">
              {isLoadingCart ? (
                // Show skeletons while loading
                Array(3)
                  .fill(0)
                  .map((_, index) => <CartItemSkeleton key={index} />)
              ) : state.items.length === 0 ? (
                <div className="flex items-center gap-x-2">
                  <p className="text-lg">Your cart is empty.</p>
                  <Link to="/shops" className="text-gray-500">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                state.items.map((item) => (
                  <Card key={item._id} className="p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={item.picture}
                        alt={item.itemName}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold">{item.itemName}</h3>
                          <ImCancelCircle
                            className="cursor-pointer"
                            onClick={() => handleItemCancel(item._id)}
                          />
                        </div>
                        <p className="text-lg">₹{item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateQuantity(item._id, item.quantity - 1)
                            }
                          >
                            <FaMinus className="h-3 w-3" />
                          </Button>
                          <Input
                            className="w-20 text-center"
                            value={quantities[item._id] || item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item._id, e.target.value)
                            }
                            onBlur={() =>
                              handleQuantityBlur(item._id, item.quantity)
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateQuantity(item._id, item.quantity + 1)
                            }
                          >
                            <FaPlus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Offers Section */}
            {offerDetails.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Available Offers</h2>
                <RadioGroup
                  value={Object.values(selectedOffers)[0] || ""}
                  onValueChange={(value) => {
                    if (value === "") {
                      setSelectedOffers({});
                      return;
                    }
                    const itemId = state.items.find((item) =>
                      item.offerId?.includes(value)
                    )?._id;
                    if (itemId) handleOfferSelection(itemId, value);
                  }}
                >
                  <div className="space-y-4">
                    {isLoadingOffers ? (
                      // Show offer skeletons while loading
                      Array(3)
                        .fill(0)
                        .map((_, index) => <OfferSkeleton key={index} />)
                    ) : (
                      offerDetails.map(
                        (offer: {
                          _id: string;
                          offerDescription: {
                            discountRate?: number;
                            plusOffers?: number;
                            description: string;
                          };
                          offerType: { name: string };
                        }) => {
                          const applicableItems = state.items.filter((item) =>
                            item.offerId?.includes(offer._id)
                          );

                          return (
                            <Card key={offer._id} className="p-4 bg-green-200">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={offer._id}
                                  id={offer._id}
                                />
                                <Label htmlFor={offer._id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {offer.offerType.name}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      Applicable on:{" "}
                                      {applicableItems
                                        .map((item) => item.itemName)
                                        .join(", ")}
                                    </span>
                                    <span className="text-sm text-green-600">
                                      {offer.offerDescription.description}
                                      {offer.offerDescription.plusOffers &&
                                        ` (Get ${offer.offerDescription.plusOffers} extra)`}
                                      {offer.offerDescription.discountRate &&
                                        ` (${offer.offerDescription.discountRate}% off)`}
                                    </span>
                                  </div>
                                </Label>
                              </div>
                            </Card>
                          );
                        }
                      )
                    )}
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-1/3">
            {isLoadingCart ? (
              <OrderSummarySkeleton />
            ) : (
              <Card className="p-4 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                {state.items.map((item) => {
                  const priceDetails = calculateItemPrice(item);
                  return (
                    <div key={item._id} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {item.itemName} × {priceDetails.totalItems}
                          {priceDetails.totalItems !== item.quantity && (
                            <span className="text-green-600 ml-1">
                              (Including {priceDetails.totalItems - item.quantity}{" "}
                              free)
                            </span>
                          )}
                        </span>
                        <div>
                          {priceDetails.savings > 0 && (
                            <span className="line-through text-gray-500 mr-2">
                              ₹{priceDetails.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span>₹{priceDetails.finalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      {priceDetails.appliedOffer && (
                        <div className="text-xs text-green-600">
                          {priceDetails.appliedOffer.offerDescription.description}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-bold">Final Total:</p>
                    <p className="text-xl font-bold">
                      ₹{calculateCartTotal().toFixed(2)}
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4" 
                  onClick={handleCheckout}
                  disabled={state.items.length === 0}
                >
                  Proceed to Checkout
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};