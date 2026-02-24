const orderModel = require("../models/order.model");
const axios = require("axios");

async function createOrder(req, res) {
  const user = req.user;
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  try {
    const cartResponse = await axios.get("http://localhost:3002/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Cart response data:", cartResponse.data.cart);

    const products = await Promise.all(
      cartResponse.data.cart.items.map(async (item) => {
        const response = await axios.get(
          `http://localhost:3001/api/products/${item.productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        return response.data?.data ?? response.data;
      }),
    );

    // console.log("Product Fetched", JSON.stringify(products, null, 2));
    // return res.status(200).json({ products });

    let priceAmount = 0;
    const orderItems = cartResponse.data.cart.items.map((item, index) => {
      const product = products.find((p) => p._id === item.productId);

      // if not in stock, does not allow order creation
      if (product.stock < item.quantity) {
        throw new Error(
          `Product ${product.title} is out of stock or insufficient quantity.`,
        );
      }
      const itemTotal = product.price.amount * item.quantity;
      priceAmount += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: {
          amount: itemTotal,
          currency: product.price.currency,
        },
      };
    });

    // console.log("total price", priceAmount);
    // console.log(orderItems);

    const order = await orderModel.create({
      user: user.id,
      items: orderItems,
      status: "PENDING",
      totalPrice: {
        amount: priceAmount,
        currency: "INR",
      },
      shippingAddress: req.body.shippingAddress,
    });

    res.status(201).json({ order });
    
  } catch (err) {
    console.log("Error Fetching Cart", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
}

module.exports = {
  createOrder,
};
