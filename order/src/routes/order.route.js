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

router.get("/me", createAuthMiddleware(["user"]), orderController.getMyOrders);

router.get( 
  "/:id",     
  createAuthMiddleware(["user","admin"]),
  orderController.getOrderById,
);

router.patch(
  "/:id/address",
  createAuthMiddleware(["user"]),
  validation.updateAddressValidation,
  orderController.updateShippingAddress,
);

router.post(
  "/:id/cancel",
  createAuthMiddleware(["user"]),
  orderController.cancelOrder,
);

module.exports = router;
