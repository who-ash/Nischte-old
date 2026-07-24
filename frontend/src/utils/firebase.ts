import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';
import { API } from './api';
import { useAuth } from "@clerk/clerk-react";
import {
    FIREBASE_API_KEY,
    AUTH_DOMAIN,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGE_SENDER_ID,
    APP_ID,
    MEASUREMENT_ID,
    VAPIKEY
} from './firebase.config';

// Firebase Configuration
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: AUTH_DOMAIN,
    projectId: PROJECT_ID,
    storageBucket: STORAGE_BUCKET,
    messagingSenderId: MESSAGE_SENDER_ID,
    appId: APP_ID,
    measurementId: MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Custom hook to handle notifications
export const useNotifications = () => {
    const { getToken: getAuthToken } = useAuth();

    // Update FCM Token in Database
    const updateFcmTokenInDb = async (token: string, userId: string) => {
        try {
            console.log("FCM Token:", token);
            const clerkToken = await getAuthToken();
            await axios.post(
                `${API}/api/v1/user/update-fcm-token`,
                { userId, fcmToken: token },
                {
                    headers: {
                        "Authorization": `Bearer ${clerkToken}`
                    }
                }
            );
            console.log("FCM Token updated in DB.");
        } catch (error) {
            console.error("Error updating FCM token:", error);
        }
    };

    // Setup Foreground Notifications
    const setupForegroundNotifications = () => {
        onMessage(messaging, (payload) => {
            console.log('📩 Received foreground message:', payload);

            if (Notification.permission === "granted") {
                new Notification(payload.notification?.title || 'New Notification', {
                    body: payload.notification?.body || 'You have a new message',
                    icon: '/icon.png'
                });
            }
        });
    };

    // Request Notification Permission and Register Service Worker
    const requestNotification = async (userId: string) => {
        try {
            if (!userId) return;

            const permission = await Notification.requestPermission();

            if (permission === "granted") {
                console.log("✅ Notification permission granted.");

                // Register Service Worker
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log('🚀 Service Worker registered:', registration.scope);
                }

                // Get FCM Token
                const fcmToken = await getToken(messaging, { vapidKey: VAPIKEY });

                if (fcmToken) {
                    await updateFcmTokenInDb(fcmToken, userId);
                } else {
                    console.log("⚠️ No FCM Token available.");
                }

                // Set up Foreground Notifications
                setupForegroundNotifications();

                // Refresh FCM Token every 30 mins
                setInterval(async () => {
                    const refreshedToken = await getToken(messaging, { vapidKey: VAPIKEY });

                    if (refreshedToken) {
                        console.log("🔄 FCM Token refreshed:", refreshedToken);
                        await updateFcmTokenInDb(refreshedToken, userId);
                    }
                }, 30 * 60 * 1000);
            } else {
                console.log("🚫 Notification permission denied.");
            }
        } catch (error) {
            console.error("❌ Error requesting notification permission:", error);
        }
    };

    return { requestNotification };
};
