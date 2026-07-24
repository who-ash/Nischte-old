import axios from "axios";
import sha256 from "sha256";
import uniqid from "uniqid";
import { Payment } from "../models/payment.model.js";
import { FRONTEND_URL, PHONEPE_HOST_URL, MERCHANT_ID, SALT_KEY, SALT_INDEX } from "../config/phone-pe.config.js";

export const initiatePayment = async (req, res) => {
  try {    
    const plainData = req.query.data;
    console.log("Received request data:", plainData);

    if (!plainData) {
      return res.status(400).json({ message: "Missing data" });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(plainData);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return res.status(400).json({ message: "Invalid JSON format" });
    }

    const { amount } = parsedData;
    console.log("Parsed amount:", amount);

    const amountInPaise = Number(amount) * 100;
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const merchantTransactionId = uniqid();
    console.log("Generated Merchant Transaction ID:", merchantTransactionId);

    const tempPaymentData = {
      merchantTransactionId,
      amount: amountInPaise,
    };

    const encodedData = Buffer.from(JSON.stringify(tempPaymentData)).toString('base64');

    let normalPayLoad = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      amount: amountInPaise,
      redirectUrl: `${FRONTEND_URL}/payment/callback?data=${encodedData}`,
      redirectMode: "POST",
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    let base64EncodedPayload = bufferObj.toString("base64");

    let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    console.log("Sending payment request to PhonePe...");

    let response;
    try {
      response = await axios.post(
        `${PHONEPE_HOST_URL}/pg/v1/pay`,
        { request: base64EncodedPayload },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": xVerifyChecksum,
            accept: "application/json",
          },
        }
      );

      // console.log("huh:::::", response.data.data.instrumentResponse.redirectInfo.url,)
      // console.log({
      //   url: `${PHONEPE_HOST_URL}/pg/v1/pay`,
      //   payload: normalPayLoad,
      //   base64Payload: base64EncodedPayload,
      //   checksumString: string,
      //   computedChecksum: sha256_val,
      //   finalHeader: xVerifyChecksum
      // });
    } catch (axiosError) {
      console.error("Axios request error:", axiosError);
      return res.status(500).json({
        success: false,
        message: "Failed to connect to PhonePe API",
        error: axiosError.message
      });
    }

    console.log("PhonePe API Response:", response.data.data.instrumentResponse);

    if (response.data.success) {
      return res.status(200).json({
        success: true,
        redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
        merchantTransactionId,
        data: encodedData
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment initiation failed",
        error: response.data
      });
    }
  } catch (error) {
    console.error("Unexpected payment initiation error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while initiating payment",
      error: error.message
    });
  }
};

export const validatePayment = async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    console.log("Validating Payment for Transaction ID:", merchantTransactionId);

    const statusUrl = `${PHONEPE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
    const string = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}${SALT_KEY}`;
    const sha256_val = sha256(string);
    const xVerifyChecksum = `${sha256_val}###${SALT_INDEX}`;

    const response = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerifyChecksum,
        "X-MERCHANT-ID": MERCHANT_ID,
        accept: "application/json",
      },
    });

    switch(response.data.code) {
      case "PAYMENT_SUCCESS":
        const paymentData = response.data.data;
        const newPayment = new Payment({
          merchantTransactionId: paymentData.merchantTransactionId,
          transactionId: paymentData.transactionId,
          amount: paymentData.amount,
          state: paymentData.state,
          paymentInstrument: paymentData.paymentInstrument,
        });
        const paymentDetails = await newPayment.save();
        return res.status(200).json({
          success: true,
          paymentDetails
        });

      case "PAYMENT_PENDING":
        return res.status(202).json({
          success: true,
          message: "Payment is pending",
          details: response.data.data
        });

      case "PAYMENT_DECLINED":
      case "PAYMENT_ERROR":
        return res.status(400).json({
          success: false,
          message: "Payment was declined or failed",
          details: response.data.data
        });

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown payment status: ${response.data.code}`,
          details: response.data.data
        });
    }

  } catch (error) {
    console.error("Payment validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment validation failed",
      error: error.message
    });
  }
};
