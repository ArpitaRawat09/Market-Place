jest.mock("axios");
const axios = require("axios");
const request = require("supertest");
const app = require("../../src/app");
const { getAuthCookie } = require("../setup/auth");

describe("POST /api/orders — Create order from current cart", () => {
  const sampleAddress = {
    street: "123 Main St",
    city: "Metropolis",
    state: "CA",
    zipCode: "90001",
    pincode: "90210",
    country: "USA",
    // phone: "1234567890",
  };

  const cartItems = [
    {
      productId: "64b6013377c2d215b34c7d8a",
      quantity: 2,
    },
  ];
  

  const productCatalog = {
    "64b6013377c2d215b34c7d8a": {
      _id: "64b6013377c2d215b34c7d8a",
      title: "Test Product",
      price: { amount: 150, currency: "INR" },
      stock: 10,
    },
  };

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({ data: { cart: { items: cartItems } } });
      }
      if (url.includes("/api/products/")) {
        const id = url.split("/api/products/")[1];
        return Promise.resolve({ data: { data: productCatalog[id] } });
      }
      return Promise.reject(new Error("Unexpected axios request"));
    });
  });

  it("creates order from current cart, computes totals, sets status=PENDING, reserves inventory", async () => {
    // Example: Provide any inputs the API expects (headers/cookies/body). Adjust when auth is wired.
    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", getAuthCookie())
      .send({ shippingAddress: sampleAddress })
      .expect("Content-Type", /json/)
      .expect(201);

    // Response shape assertions (adjust fields as you implement)
    expect(res.body).toBeDefined();
    expect(res.body.order).toBeDefined();
    const { order } = res.body;
    expect(order._id).toBeDefined();
    expect(order.user).toBeDefined();
    expect(order.status).toBe("PENDING");

    // Items copied from priced cart
    expect(Array.isArray(order.items)).toBe(true);
    expect(order.items.length).toBeGreaterThan(0);
    for (const it of order.items) {
      expect(it.productId).toBeDefined();
      expect(it.quantity).toBeGreaterThan(0);
      expect(it.price).toBeDefined();
      expect(typeof it.price.amount).toBe("number");
      expect(["USD", "INR"]).toContain(it.price.currency);
    }

    // Totals include taxes + shipping
    expect(order.totalPrice).toBeDefined();
    expect(typeof order.totalPrice.amount).toBe("number");
    expect(["USD", "INR"]).toContain(order.totalPrice.currency);

    // Shipping address persisted
      expect(order.shippingAddress).toMatchObject({
        street: sampleAddress.street,
        city: sampleAddress.city,
        state: sampleAddress.state,
        zipCode: sampleAddress.zipCode,
        country: sampleAddress.country,
        pincode: sampleAddress.pincode,
        // phone: sampleAddress.phone,
      });

    // Inventory reservation acknowledgement (shape up to you)
    // For example, you might include a flag or reservation id
    // expect(res.body.inventoryReservation).toEqual({ success: true })
  });

  it("returns 422 when shipping address is missing/invalid", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", getAuthCookie())
      .send({})
      .expect("Content-Type", /json/)
      .expect(400);

    expect(res.body.errors || res.body.message).toBeDefined();
  });
});
