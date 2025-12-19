const mongoose = require("mongoose");
const productModel = require("../models/product.model");
const { uploadImage } = require("../services/imagekit.service");

async function createProduct(req, res) {
  try {
    const { title, description, priceAmount, priceCurrency = "INR" } = req.body;

    const seller = req.user?.id;

    if (!seller) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const price = {
      amount: Number(priceAmount),
      currency: priceCurrency,
    };

    const images = await Promise.all(
      (req.files || []).map((file) => uploadImage({ buffer: file.buffer }))
    );

    const product = await productModel.create({
      title,
      description,
      price,
      seller,
      images,
    });

    return res.status(201).json({
      message: "Product created",
      data: product,
    });
  } catch (err) {
    console.error("Create product error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getProducts(req, res) {
  const { q, minPrice, maxPrice, skip = 0, limit = 20 } = req.query;

  const filter = {};

  if (q) {
    filter.$text = { $search: q };
  }
  if (minPrice) {
    filter["price.amount"] = {
      ...filter["price.amount"],
      $gte: Number(minPrice),
    };
  }
  if (maxPrice) {
    filter["price.amount"] = {
      ...filter["price.amount"],
      $lte: Number(maxPrice),
    };
  }
  const products = await productModel
    .find(filter)
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 20));

  return res.status(200).json({
    message: "Products fetched successfully",
    data: products,
  });
}

async function getSellerProducts(req, res) {
  const sellerId = req.user?.id;

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { skip = 0, limit = 20 } = req.query;

  const products = await productModel
    .find({ seller: sellerId })
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 20));

  return res.status(200).json({
    message: "Seller products fetched successfully",
    data: products,
  });
}

async function getProductById(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }
  const product = await productModel.findById(id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.status(200).json({
    message: "Product fetched successfully",
    data: product,
  });
}

async function updateProductById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await productModel.findById(id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.seller.toString() !== req.user?.id) {
    return res
      .status(403)
      .json({ message: "Forbidden: You cannot update this product" });
  }

  const allowedUpdates = ["title", "description", "price"];
  for (const key of Object.keys(req.body)) {
    if (allowedUpdates.includes(key)) {
      if (key === "price" && typeof req.body[key] === "object") {
        if (req.body[key].amount !== undefined) {
          product.price.amount = Number(req.body[key].amount);
        }
        if (req.body[key].currency !== undefined) {
          product.price.currency = req.body[key].currency;
        }
      } else {
        product[key] = req.body[key];
      }
    }
  }

  await product.save();

  return res.status(200).json({
    message: "Product updated successfully",
    data: product,
  });
}

async function deleteProductById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await productModel.findById(id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.seller.toString() !== req.user?.id) {
    return res
      .status(403)
      .json({ message: "Forbidden: You cannot delete this product" });
  }

  await product.deleteOne();

  return res.status(200).json({
    message: "Product deleted successfully",
    data: null,
  });
}

async function getProductsBySeller(req, res) {
  const seller = req.user;

  const { skip = 0, limit = 20 } = req.query;

  const products = await productModel
    .find({ seller: seller.id })
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 20));

  return res.status(200).json({
    message: "Products fetched successfully",
    data: products,
  });
}

module.exports = {
  createProduct,
  getProducts,
  getSellerProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  getProductsBySeller,
};
