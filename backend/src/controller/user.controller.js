import { User } from "../models/user.models.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { Shop } from "../models/shop.model.js";
import dotenv from 'dotenv';
dotenv.config();

export const updateUserRole = async (req, res) => {
  try {
    console.log("here");
    const { userId } = req.params;
    const role = 'owner';

    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role }
    });

    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      error: 'Failed to update role',
      details: error.message 
    });
  }
};


export const createUser = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!data) {
      console.error("Invalid webhook payload:", req.body);
      return res.status(400).send("Invalid webhook payload");
    }

    if (type === "user.created" || type === "user.updated" || type === "session.created") {
        const userData = {
            userId: data.user_id || null,
            userData: {
                data
            },
            lastSignIn: type === "session.created" ? new Date() : undefined,
        };

        await User.findOneAndUpdate(
            { userId: data.user_id },  
            { 
              $set: userData,       
            },
            { upsert: true, new: true } 
        );
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook handling error:", error);
    res.status(500).send("Error processing webhook");
  }
};

export const updateFCMToken = async(req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ message: "Missing userId or fcmToken" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },           
      { 
        $set: { fcmToken }   
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "FCM token updated", user: updatedUser });
  } catch (error) {
    console.error("Error processing FCM token update:", error);
    res.status(500).send("Error processing FCM token update");
  }
}

export const getFCMTokenForShopOwner = async (req, res) => {
    try {
      console.log("calling...")
        const { shopOwnerId } = req.params;
        
        const shop = await Shop.findOne({ ownerId: shopOwnerId });
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }

        const user = await User.findOne({ userId: shop.ownerId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, fcmToken: user.fcmToken });
    } catch (error) {
        console.error('Error fetching FCM token:', error);
        res.status(500).json({ success: false, message: 'Error fetching FCM token' });
    }
};
