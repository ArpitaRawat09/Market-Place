const express = require("express");
const cookieParser = require("cookie-parser");
const productRoutes = require("../src/routes/product.route")

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/products", productRoutes);

module.exports = app;
