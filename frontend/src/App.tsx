import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectRoute";
import { Home } from "./pages/Home";
import NotFound from "./components/NotFound";
import { Shops } from "./pages/Shops";
import { AboutUs } from "./pages/AboutUs";
import { ContactUs } from "./pages/ContactUs";
import { ManageShops } from "./pages/ManageShops";
import { RegisterShop } from "./pages/RegisterShop";
import { UpdateShop } from "./pages/UpdateShop";
import ShopDetails from "./pages/ShopDetails";
import { Toaster } from "sonner";
import { AddMenuItem } from "./pages/AddMenuItems";
import { MenuDetails } from "./pages/MenuDetails";
import { Offer } from "./pages/Offer";
import { UpdateMenu } from "./pages/UpdateMenu";
import { UpdateOffer } from "./pages/UpdateOffer";
import { Cart } from "./pages/Cart";
import { CartProvider } from "./context/CartContext";
// import { Order } from "./pages/Order";
import { UserOrder } from "./pages/UserOrder";
import { ShopOrders } from "./pages/ShopOrders";
import { Items } from "./pages/Items";
import { Support } from "./pages/Support";
import { PaymentCallback } from "./pages/Payment";
import { useEffect, useState } from "react";
import { useNotifications } from "./utils/firebase";
import { useUser } from "@clerk/clerk-react";


function App() {

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
            console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
        });
}

  const { requestNotification} = useNotifications();
  const { user, isLoaded } = useUser();
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isLoaded && user) {
    console.log("bla: ", user);

      setUserId(user.id);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (userId) {
      requestNotification(userId); 
    }
  }, [userId]);

  return (
    <>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/items" element={<Items />} />
            <Route
              path="/support/:userId"
              element={
                <ProtectedRoute>
                  <Support />
                </ProtectedRoute>
              }
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/:userId/order" element={<UserOrder />} />
            {/* <Route path="/order" element={<Order />} /> */}
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            
            <Route path="/payment/callback" element={<PaymentCallback />} />
          
            <Route path="/shop">
              <Route
                path="manage"
                element={
                  <ProtectedRoute>
                    <ManageShops />
                  </ProtectedRoute>
                }
              />
              <Route path="orders/:shopId" element={<ShopOrders />} />
              <Route
                path="manage/:shopId"
                element={
                  <ProtectedRoute>
                    <ShopDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="register"
                element={
                  <ProtectedRoute>
                    <RegisterShop />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":shopId/menu/:menuId/offer/:offerId/update"
                element={
                  <ProtectedRoute>
                    <UpdateOffer />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":shopId/menu/:menuId/offer"
                element={
                  <ProtectedRoute>
                    <Offer />
                  </ProtectedRoute>
                }
              />
    
              <Route
                path="update/:shopId"
                element={
                  <ProtectedRoute>
                    <UpdateShop />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":shopId"
                element={
                  <ProtectedRoute>
                    <ShopDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":shopId/menu/:menuId/update"
                element={
                  <ProtectedRoute>
                    <UpdateMenu />
                  </ProtectedRoute>
                }
              />

              <Route
                path=":shopId/add-menu"
                element={
                  <ProtectedRoute>
                    <AddMenuItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":shopId/menu/:menuId"
                element={
                  <ProtectedRoute>
                    <MenuDetails />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      <Toaster />
    </>
  );
}

export default App;
