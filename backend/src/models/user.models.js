import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        userId: { 
            type: String, 
            required: true
        },
        userData: { 
            type: Object
        }, 
        lastSignIn: { 
            type: Date 
        }, 
        fcmToken: {
            type: String
        }
    },
    { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);

