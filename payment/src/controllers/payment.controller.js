const paymentModel = require("../models/payment .model");
const axios = require("axios");

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
      }
    );

    console.log("Order response:", orderResponse.data);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}

module.exports = {
  createPayment,
};
