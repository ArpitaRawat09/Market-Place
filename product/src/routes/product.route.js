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

module.exports = router;
