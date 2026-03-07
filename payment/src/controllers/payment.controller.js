const paymentModel = require("../models/payment .model");
const axios = require("axios");

// razorpay integration
require("dotenv").config();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPayment(req, res) {
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  try {
    const orderId = req.params.orderId;

    const orderResponse = await axios.get(
      "http://localhost:3003/api/orders/" + orderId,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // console.log("Order response:", orderResponse.data.order.totalPrice);

    const price = orderResponse.data.order.totalPrice;
    const order = await razorpay.orders.create(price);

    const payment = new paymentModel({
      order: orderId,
      paymentId: order.id,
      razorpayOrderId: order.id,
      user: req.user.id,
      price: {
        amount: order.amount,
        currency: order.currency,
      },
    });

    // await payment.save();

    res.status(201).json({ message: "Payment created", payment });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}

async function verifyPayment(req, res) {
  const { razorpayOrderId, paymentId } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    const {
      validatePaymentVerification,
    } = require("../../node_modules/razorpay/dist/utils/razorpay-utils.js");

    const isvalid = validatePaymentVerification(
      {
        order_id: razorpayOrderId,
        payment_id: paymentId,
      },
      // signature,
      // secret,
    );

    if (!isvalid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const payment = await paymentModel.findOne({
      razorpayOrderId,
      status: "PENDING",
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = "COMPLETED";

    await payment.save();

    res.status(200).json({ message: "Payment verified successfully", payment });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}

module.exports = {
  createPayment,
  verifyPayment,
};
