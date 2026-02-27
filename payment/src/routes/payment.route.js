const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

router.post(
  "/create/:orderId",
  createAuthMiddleware(["user"]),
  paymentController.createPayment,
);

module.exports = router;
