const express = require("express");
const multer = require("multer");
const productController = require("../controller/product.controller");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const { createValidateProductors } = require("../validators/product.validator");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/products
router.post(
  "/",
  createAuthMiddleware(["admin", "seller"]),
  upload.array("images", 5),
  createValidateProductors,
  productController.createProduct
);

// GET /api/products/
router.get("/", productController.getProducts);

// GET /api/products/seller
router.get(
  "/seller",
  createAuthMiddleware(["seller"]),
  productController.getSellerProducts
);

// PATCH /api/products/:id
router.patch(
  "/:id",
  createAuthMiddleware(["seller"]),
  productController.updateProductById
);

// DELETE /api/products/:id
router.delete(
  "/:id",
  createAuthMiddleware(["seller"]),
  productController.deleteProductById
);

// GET /products/seller
router.get(
  "/seller",
  createAuthMiddleware(["seller"]),
  productController.getProductsBySeller
);

// GET /api/products/:id
router.get("/:id", productController.getProductById);

module.exports = router;
