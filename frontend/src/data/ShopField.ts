import { z } from "zod";

export const ShopFields = [
  {
    name: "shopName",
    label: "Shop Name",
    type: "text",
    validation: z.string().min(1, { message: "Shop name is required" }),
  },
  // {
  //   name: "email",
  //   label: "Email",
  //   type: "email",
  //   validation: z.string().email({ message: "Invalid email address" }),
  // },
  {
    name: "address",
    label: "Address",
    type: "text",
    validation: z.string().min(1, { message: "Address is required" }),
  },
  // {
  //   name: "contactNo",
  //   label: "Contact No",
  //   type: "text",
  //   validation: z
  //     .string()
  //     .regex(/^\d{10}$/, { message: "Contact number must be 10 digits" }),
  // },
  {
    name: "picture",
    label: "Picture",
    type: "file",
    validation: z.any().optional(),
  },
];
