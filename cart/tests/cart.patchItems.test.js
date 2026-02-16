const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const Cart = require("../src/models/cart.model");

jest.setTimeout(20000);

describe("PATCH /api/cart/items/:productId", () => {
  const buildToken = ({ id, role = "user" } = {}) => {
    const userId = id ?? new mongoose.Types.ObjectId().toHexString();
    const payload = { _id: userId, role };
    return {
      token: jwt.sign(payload, process.env.JWT_SECRET),
      userId,
    };
  };

  const addItem = ({ token, productId, quantity = 1 }) =>
    request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity });

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterEach(async () => {
    if (!mongoose.connection.db) return;
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  it("updates quantity for an existing cart item", async () => {
    const { token, userId } = buildToken();
    const productId = new mongoose.Types.ObjectId().toHexString();

    await addItem({ token, productId, quantity: 1 });

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.cart?.items).toHaveLength(1);
    expect(res.body.cart?.items[0]?.quantity).toBe(5);

    const stored = await Cart.findOne({ user: userId });
    expect(stored.items[0].quantity).toBe(5);
  });

  it("validation error for invalid productId", async () => {
    const { token } = buildToken();

    const res = await request(app)
      .patch("/api/cart/items/invalid-product-id")
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(400);
  });

  it("validation error for non-positive quantity", async () => {
    const { token } = buildToken();
    const productId = new mongoose.Types.ObjectId().toHexString();

    await addItem({ token, productId, quantity: 2 });

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 0 });

    expect(res.status).toBe(400);
  });

  it("401 when no token provided", async () => {
    const productId = new mongoose.Types.ObjectId().toHexString();

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(401);
  });

  it("401 when token invalid", async () => {
    const productId = new mongoose.Types.ObjectId().toHexString();

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", "Bearer invalid.token.value")
      .send({ quantity: 2 });

    expect(res.status).toBe(401);
  });

  it("403 when role not allowed", async () => {
    const { token } = buildToken({ role: "seller" });
    const productId = new mongoose.Types.ObjectId().toHexString();

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(403);
  });
});
