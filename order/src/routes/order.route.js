const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const orderController = require("../controller/order.controller");
const validation = require("../middlewares/validation.middleware");

const router = express.Router();
router.post(
  "/",
  createAuthMiddleware(["user"]),
  validation.createOrderValidation,
  orderController.createOrder,
);

module.exports = router;
