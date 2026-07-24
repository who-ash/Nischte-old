import Form from "@/components/Form";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FC, useEffect } from "react";
import { ShopFields } from "@/data/ShopField";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { API } from "@/utils/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const RegisterShop: FC = () => {

  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id;
  const userphoneNumber = user?.phoneNumbers[0].phoneNumber;
  if(!userId) {
    throw new Error("failed to get the user id");
  }


  // console.log("user emails", user?.primaryEmailAddress?.emailAddress);

  const handleRegister = async (
    data: Record<string, any>,
    resetForm: () => void
  ) => {
    const ownerId = user?.id;
    const email = user?.primaryEmailAddress?.emailAddress;

    const formData = new FormData();

    if (ownerId) {
      formData.append("ownerId", ownerId);
    }

    if (userphoneNumber) {
      formData.append("contactNo", userphoneNumber);
    }


    if (email) {
      formData.append("email", email);
    }

    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    if (data.picture) {
      formData.append("picture", data.picture[0]);
    }

    try {

      const token = await getToken();
      await axios.post(`${API}/api/v1/shop`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
         }
      });
      const userRoleChange = await axios.put(`${API}/api/v1/user/${userId}/update-role`, {}, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      console.log("user role change: ", userRoleChange);
      toast.success("Shop registered successfully!");
      navigate("/shop/manage");
      resetForm();
    } catch (error: any) {
      console.error("Error registering shop:", error);
      toast.error("Failed to register shop. Please try again.");
    }
  };


  // useEffect(() => {
  //   console.log("userId: ", );
  // }, []);

  return (
    <>
      <div className="px-6 md:px-[200px] flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Register Your Shop
              </h2>
              <Form
                fields={ShopFields}
                onSubmit={handleRegister}
                submitButtonText="Register Shop"
              />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};
