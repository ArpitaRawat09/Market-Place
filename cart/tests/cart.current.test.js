const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const Cart = require("../src/models/cart.model");

jest.setTimeout(20000);

describe("GET /api/cart", () => {
  const buildToken = ({ id, role = "user" } = {}) => {
    const userId = id ?? new mongoose.Types.ObjectId().toHexString();
    return {
      token: jwt.sign({ _id: userId, role }, process.env.JWT_SECRET),
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

  it("returns an empty cart when none exists", async () => {
    const { token } = buildToken();

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cart).toEqual(
      expect.objectContaining({
        items: [],
        totals: { itemCount: 0, totalQuantity: 0 },
      }),
    );
  });

  it("returns cart items with aggregated totals", async () => {
    const { token, userId } = buildToken();
    const firstProduct = new mongoose.Types.ObjectId().toHexString();
    const secondProduct = new mongoose.Types.ObjectId().toHexString();

    await addItem({ token, productId: firstProduct, quantity: 1 });
    await addItem({ token, productId: secondProduct, quantity: 4 });

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cart?.items).toHaveLength(2);
    expect(res.body.cart?.totals).toEqual({ itemCount: 2, totalQuantity: 5 });

    const stored = await Cart.findOne({ user: userId });
    expect(stored.items).toHaveLength(2);
    expect(stored.items.reduce((sum, item) => sum + item.quantity, 0)).toBe(5);
  });

  it("401 when no token is provided", async () => {
    const res = await request(app).get("/api/cart");

    expect(res.status).toBe(401);
  });

  it("401 when token is invalid", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
  });

  it("403 when role is not allowed", async () => {
    const { token } = buildToken({ role: "seller" });
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
