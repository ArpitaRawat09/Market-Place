const cartModel = require("../models/cart.model");

async function getCart(req, res) {
  const user = req.user;

  let cart = await cartModel.findOne({ user: user._id });
  

  if (!cart) {
    cart = new cartModel({ user: user._id, items: [] });
    await cart.save();
  }

  const itemCount = cart.items.length;
  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  res.status(200).json({
    cart: {
      items: cart.items,
      totals: { itemCount, totalQuantity },
    },
  });   
}

async function addItemToCart(req, res) {
  const { productId, quantity } = req.body;
  const user = req.user;

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    return res
      .status(400)
      .json({ message: "Quantity must be greater than zero" });
  }

  try {
    let cart = await cartModel.findOne({ user: user._id });

    if (!cart) {
      cart = new cartModel({
        user: user._id,
        items: [{ productId, quantity: qty }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId,
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += qty;
      } else {
        cart.items.push({ productId, quantity: qty });
      }
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart successfully", cart });
  } catch (error) {
    console.error("Error adding item to cart", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function updateCartItem(req, res) {
  const { productId } = req.params;
  const { quantity } = req.body;
  const qty = Number(quantity);

  if (Number.isNaN(qty) || qty <= 0) {
    return res
      .status(400)
      .json({ message: "Quantity must be greater than zero" });
  }

  try {
    const cart = await cartModel.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (entry) => entry.productId.toString() === productId,
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = qty;
    await cart.save();
    return res.status(200).json({ message: "Cart updated", cart });
  } catch (error) {
    console.error("Error updating cart item", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  addItemToCart,
  updateCartItem,
  getCart,
};
