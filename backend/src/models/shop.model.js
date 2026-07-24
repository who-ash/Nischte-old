import mongoose, { Schema, model } from "mongoose";

const shopSchema = new Schema(
  {
    shopName: {
      type: String,
      required: [true, "Make sure to add the shop name"],
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Make sure to add the shop details."],
    },
    address: {
      type: String,
      required: [true, "Make sure to add the shop address"],
      trim: true,
    },
    contactNo: {
      type: String,
      required: [true, "Make to add the contact number"],
    },

    // required true
    picture: {
      type: String,
      required: [false, "Make sure to add the shop picture"],
    },
    ownerId: {
      type: String,
      required: [true, "Owner id is required"],
    },
    fmcToken: {
      type: String,
      required: false
    }
  },
  { timestamps: true }
);

export const Shop = model("Shop", shopSchema);
