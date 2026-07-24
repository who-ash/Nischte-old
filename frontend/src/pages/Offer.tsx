import { FC, useEffect, useState } from "react";
import OfferForm from "@/components/OfferForm";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OfferFields } from "@/data/OfferField";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaPen } from "react-icons/fa";
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
import { MdDelete } from "react-icons/md";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { SkeletonGrid } from "@/components/SkeletonGrid";
import { useAuth } from "@clerk/clerk-react";

interface OfferType {
  name: string;
}

interface OfferDescription {
  minOrder?: number;
  numberOfVisits?: number;
  description: string;
  discountRate?: number;
  plusOffers?: number;
  specialOccasionDate?: string;
}

interface Offer {
  offerType: OfferType;
  _isActive: boolean;
  offerDescription: OfferDescription;
  _id: string;
}

export const Offer: FC = () => {
  const { shopId, menuId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [offers, setOffer] = useState<Offer[]>([]);
  const [loading, setloading] = useState<Boolean>(false);

  const handleAddOffer = async (data: any, resetForm: () => void) => {
    const offerData = {
      shopId,
      itemId: menuId,
      offerType: { name: data["offerType.name"] },
      offerDescription: {
        discountRate: data["offerDescription.discountRate"],
        minOrder: data["offerDescription.minOrder"],
        plusOffers: data["offerDescription.plusOffers"],
        specialOccasionDate: data["offerDescription.specialOccasionDate"],
        discountDishes: data["offerDescription.discountDishes"],
        numberOfVisits: data["offerDescription.numberOfVisits"],
        description: data["offerDescription.description"],
      },
      _isActive: data["_isActive"],
    };

    try {
      const token = await getToken();
      const response = await axios.post(`${API}/api/v1/offer`, offerData, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      console.log("created offer: ", response.data);
      resetForm();
      fetchOffer();
    } catch (error) {
      console.error("Failed to create the offer");
    }
  };

  const fetchOffer = async () => {
    try {
      setloading(true);
      const res = await axios.get(`${API}/api/v1/offer/${shopId}/${menuId}`);
      setOffer(res.data.offers[0].offers);
      console.log(res.data.offers[0].offers);
    } catch (error) {
      console.log("Failed to get the offer");
    } finally {
      setloading(false);
    }
  };

  const handleOfferUpdate = (offerId: string): void => {
    console.log("here at update offer")
    navigate(`/shop/${shopId}/menu/${menuId}/offer/${offerId}/update`);
  };

  const handleDeleteOffer = async (offerId: string): Promise<void> => {
    try {
      const token = await getToken();
      console.log("hehe");
      const data = {
        shopId,
        itemId: menuId,
      };
      await axios.delete(`${API}/api/v1/offer/${offerId}`, { data, 
        headers: {
          "Authorization": `Bearer ${token}`
        }
       });
      toast.success("Offer deleted successfully!");
      setOffer((prevOffers) =>
        prevOffers.filter((offer) => offer._id !== offerId)
      );
      navigate(`/shop/${shopId}/menu/${menuId}/offer`);
    } catch (error) {
      console.log("Failed to delete the shop");
      toast.error("Failed to delete offer. Please try again.");
    }
  };

  useEffect(() => {
    fetchOffer();
  }, []);
  return (
    <>
      <div className="px-6 md:px-[200px] flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Add Offer Form */}
            <div>
              <OfferForm fields={OfferFields} onSubmit={handleAddOffer} />
            </div>
            {/* Manage offer */}

            <div className="sm:pl-3">
              {offers.length > 0 ? (
                <h1 className="font-extrabold text-xl mb-4 mt-4 sm:mt-0">
                  Avaiable Offer
                </h1>
              ) : null}
              {offers &&
                offers.length > 0 &&
                offers.map((offer) =>
                  loading ? (
                    <SkeletonGrid count={1} />
                  ) : (
                    <Card
                      key={offer._id}
                      className={`flex flex-col mb-3 pl-3 ${
                        offer._isActive ? "bg-green-200" : "bg-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center pt-2">
                        <p className="font-semibold">{offer.offerType.name}</p>
                        <div className="space-x-2 pr-2">
                          <Button className="p-2" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOfferUpdate(offer._id);
                              }}>
                            <FaPen
                              size={18}
                            />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                className="p-2"
                                variant="destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MdDelete size={18} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure you want to delete this offer?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete your offer and remove your
                                  data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOffer(offer._id);
                                  }}
                                >
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="flex text-sm space-x-4">
                        <span>
                          Number of visits:{" "}
                          {offer.offerDescription.numberOfVisits}
                        </span>
                        {offer.offerDescription.plusOffers && (
                          <span>
                            Plus Offers: {offer.offerDescription.plusOffers}{" "}
                          </span>
                        )}

                        {offer.offerDescription.minOrder && (
                          <span>
                            Minimum Order: {offer.offerDescription.minOrder}{" "}
                          </span>
                        )}

                        {offer.offerDescription.specialOccasionDate && (
                          <span>
                            Special Occasion:{" "}
                            {new Date(
                              offer.offerDescription.specialOccasionDate
                            ).toLocaleDateString()}
                          </span>
                        )}

                        {offer.offerDescription.discountRate && (
                          <span>
                            Discount Rate: {offer.offerDescription.discountRate}
                            %{" "}
                          </span>
                        )}
                      </div>
                      <div className="text-sm">
                        Details: {offer.offerDescription.description}
                      </div>
                    </Card>
                  )
                )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};
