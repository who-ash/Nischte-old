import admin from 'firebase-admin';
import serviceAccount from '/home/ash/Downloads/nischte-c32df-firebase-adminsdk-fbsvc-e32ba3d6a5.json' assert { type: 'json' };

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const sendPushNotification = async (req, res) => {
    try {
        const { fcmToken, title, body } = req.body;

        const message = {
            notification: {
                title: title,
                body: body
            },
            token: fcmToken
        };

        console.log("sending notification.. ");
        
        const response = await admin.messaging().send(message);
        return res.status(200).json({ success: true, message: 'Notification sent', response });
    } catch (error) {
        console.error('Error sending push notification:', error);
        res.status(500).json({ success: false, message: 'Error sending notification' });
    }
};