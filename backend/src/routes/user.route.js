    import { Router } from "express";
    import { createUser, getFCMTokenForShopOwner, updateFCMToken, updateUserRole } from "../controller/user.controller.js";
    import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
    const router = Router();

    router.put("/:userId/update-role",ClerkExpressRequireAuth(), updateUserRole);
    router.post("/webhook/create", createUser);
    router.post("/update-fcm-token",ClerkExpressRequireAuth(), updateFCMToken);
    router.get("/fcmToken/:shopOwnerId",ClerkExpressRequireAuth(), getFCMTokenForShopOwner);

    export default router;