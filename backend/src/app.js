import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const allowedOrigins = ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true, 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Route Dec

import shopRouter from "../src/routes/shop.route.js";
import shopMenuRouter from "../src/routes/menu.route.js";
import orderRouter from "../src/routes/order.route.js";
import offerRouter from "../src/routes/offer.route.js";
import supportRouter from "../src/routes/support.route.js";
import paymentRouter from "../src/routes/payment.route.js";
import userRouter from "../src/routes/user.route.js"
import utilsRouter from "../src/routes/utils.route.js"

app.use("/api/v1/shop", shopMenuRouter);
app.use("/api/v1/shop", shopRouter);
app.use("/api/v1/support", supportRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/offer", offerRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/u", utilsRouter)

export default app;
