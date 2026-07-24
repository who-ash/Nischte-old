    import { useEffect, useState, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { toast } from 'sonner';
    import { API } from '@/utils/api';
    import axios from 'axios';
    import { useAuth, useUser } from '@clerk/clerk-react';
    import { useNotifications } from '@/utils/firebase';

    export const PaymentCallback = () => {
        const { requestNotification } = useNotifications();
        const navigate = useNavigate();
        const [isProcessing, setIsProcessing] = useState(true);
        const { user } = useUser();
        const userId = user?.id as string;
        const { getToken } = useAuth();

        const hasRun = useRef(false);

        useEffect(() => {
            if (hasRun.current) return; 
            hasRun.current = true; 

            const handleCallback = async () => {
                try {
                    const token = await getToken();
                    if (!token) throw new Error("Authorization token not available");

                    const paymentInfoStr = localStorage.getItem('paymentInfo');
                    if (!paymentInfoStr) throw new Error('Payment information not found');

                    const paymentInfo = JSON.parse(paymentInfoStr);
                    const { transactionId, timestamp } = paymentInfo;

                    // Validate timestamp (optional) - ensure callback is within reasonable time
                    const timeElapsed = Date.now() - timestamp;
                    if (timeElapsed > 1000 * 60 * 15) { // 15 minutes
                        throw new Error('Payment session expired');
                    }
                    const response = await axios.get(`${API}/api/v1/payment/validate/${transactionId}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
            
                    if (!response.data.success) {
                        console.error('Payment validation response:', response.data);
                        throw new Error(response.data.message || 'Payment validation failed');
                    }

                    const orderSummary = localStorage.getItem('orderSummary');
                    console.log("order summ == ", orderSummary);
                    if (!orderSummary) throw new Error('Order summary not found');

                    let parsedOrderSummary;
                    try {
                        parsedOrderSummary = JSON.parse(orderSummary);
                    } catch (err) {
                        throw new Error('Invalid order summary format');
                    }

                    const orderData = { ...parsedOrderSummary, transactionId: transactionId };
                    console.log("orderData at the payment: ", orderData)

                    const orderResponse = await axios.post(`${API}/api/v1/order/create`, orderData, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (!orderResponse.data.success) throw new Error(orderResponse.data.message || 'Order creation failed');

                    localStorage.removeItem('paymentInfo');

                    const shopId = orderResponse.data.order.items[0].shopId;

                    const shopResponse = await axios.get(`${API}/api/v1/shop/${shopId}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (shopResponse.data.success) {
                        const shopOwnerId = shopResponse.data.shop.ownerId;

                        await requestNotification(userId);

                        const fcmTokenResponse = await axios.get(`${API}/api/v1/user/fcmToken/${shopOwnerId}`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        });

                        if (fcmTokenResponse.data.success) {
                            const fcmToken = fcmTokenResponse.data.fcmToken;

                            if (fcmToken) {
                                const orderItems = parsedOrderSummary.items.map(
                                    (item: any) => `${item.itemName} (x${item.quantity})`
                                ).join(", ");

                                const notificationBody = `You have a new order: ${orderItems}. Total: ₹${parsedOrderSummary.cartTotal}`;

                                await axios.post(`${API}/api/v1/u/notifications/send`, {
                                    fcmToken,
                                    title: 'New Order Received',
                                    body: notificationBody
                                }, {
                                    headers: { "Authorization": `Bearer ${token}` }
                                });
                            }
                        }
                    }

                    navigate(`/${orderResponse.data.order.userId}/order`);
                } catch (error) {
                    localStorage.removeItem("currentTransactionId");
                    console.error('Error in payment processing:', error);
                    toast.error(error instanceof Error ? error.message : 'Payment processing failed.');
                    navigate('/payment/failure');
                } finally {
                    setIsProcessing(false);
                }
            };

            handleCallback();
        }, [navigate, getToken, requestNotification, userId]); 

        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">
                        {isProcessing ? 'Processing Payment...' : 'Payment Processed'}
                    </h2>
                    <p>{isProcessing ? 'Please wait while we confirm your payment...' : 'You can now check your orders.'}</p>
                    {!isProcessing && (
                        <button
                            onClick={() => navigate('/orders')}
                            className="px-4 py-2 mt-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            View Orders
                        </button>
                    )}
                </div>
            </div>
        );
    };
