import * as admin from 'firebase-admin';
import serviceAccount from '/home/ash/Downloads/nischte-c32df-firebase-adminsdk-fbsvc-e32ba3d6a5.json' assert { type: 'json' };

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const messaging = admin.messaging(); 