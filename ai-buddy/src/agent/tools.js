const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://127.0.0.1:3001";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://127.0.0.1:3002";

function formatAxiosError(error, serviceName) {
  if (error.response) {
    const { status, data } = error.response;
    const message =
      (data && (data.message || data.error)) || JSON.stringify(data || {});
    return `${serviceName} service returned ${status}: ${message}`;
  }

  if (error.code) {
    return `${serviceName} service unavailable (${error.code}).`;
  }

  return `${serviceName} request failed: ${error.message}`;
}

const searchProduct = tool(
  async ({ query, token }) => {
    console.log("searchProduct called with data:", { query, token });

    try {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, {
        params: { q: query },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return JSON.stringify(response.data);
    } catch (error) {
      return formatAxiosError(error, "Product");
    }
  },
  {
    name: "searchProduct",
    description: "Search for products based on a query",
    schema: z.object({
      query: z.string().describe("The search query for products"),
    }),
  },
);

const addProductToCart = tool(
  async ({ productId, quantity = 1, token }) => {
    console.log("addProductToCart called with data:", { productId, quantity });

    try {
      const parsedQuantity = Number(quantity);

      if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
        return "Invalid quantity. Please provide a number greater than 0.";
      }

      const response = await axios.post(
        `${CART_SERVICE_URL}/api/cart/items`,
        {
          productId,
          quantity: Math.floor(parsedQuantity),
        },
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        },
      );

      console.log("addProductToCart response:", {
        status: response.status,
        data: response.data,
      });

      return `Added product with id ${productId} (quantity: ${quantity}) to cart`;
    } catch (error) {
      console.error("addProductToCart error:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });
      return formatAxiosError(error, "Cart");
    }
  },
  {
    name: "addProductToCart",
    description: "Add a product to the shopping cart",
    schema: z.object({
      productId: z
        .string()
        .describe("The id of the product to add to the cart"),
      quantity: z
        .number()
        .optional()
        .describe("Optional quantity of the product to add to the cart. Defaults to 1."),
    }),
  },
);

module.exports = { searchProduct, addProductToCart };
