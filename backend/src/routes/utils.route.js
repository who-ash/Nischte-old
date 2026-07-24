import {Router} from"express";
import { sendPushNotification } from "../service/firebase.notification.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const router = Router();

router.post("/notifications/send", ClerkExpressRequireAuth(), sendPushNotification)

export default router;