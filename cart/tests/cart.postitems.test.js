const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const Cart = require("../src/models/cart.model");

jest.setTimeout(20000);

describe("POST /api/cart/items", () => {
  const buildToken = ({ id, role = "user" } = {}) => {
    const userId = id ?? new mongoose.Types.ObjectId().toHexString();
    const payload = { _id: userId, role };
    return {
      token: jwt.sign(payload, process.env.JWT_SECRET),
      userId,
    };
  };

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

  it("creates new cart and adds first item", async () => {
    const { token, userId } = buildToken();
    const productId = new mongoose.Types.ObjectId().toHexString();

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Item added to cart successfully");
    expect(res.body.cart?.items).toHaveLength(1);
    expect(res.body.cart.items?.[0]?.quantity).toBe(2);
    expect(String(res.body.cart.items?.[0]?.productId)).toBe(productId);

    const storedCart = await Cart.findOne({ user: userId });
    expect(storedCart).not.toBeNull();
    expect(storedCart.items).toHaveLength(1);
    expect(storedCart.items[0].quantity).toBe(2);
  });

  it("increments quantity when item already exists", async () => {
    const { token, userId } = buildToken();
    const productId = new mongoose.Types.ObjectId().toHexString();

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 1 });

    const updateRes = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 3 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.cart?.items).toHaveLength(1);
    expect(updateRes.body.cart.items?.[0]?.quantity).toBe(4);

    const updatedCart = await Cart.findOne({ user: userId });
    expect(updatedCart.items[0].quantity).toBe(4);
  });

  it("validation error for invalid productId", async () => {
    const { token } = buildToken();
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: "123", quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "productId" }),
      ]),
    );
  });

  it("validation error for non-positive quantity", async () => {
    const { token } = buildToken();
    const productId = new mongoose.Types.ObjectId().toHexString();
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "quantity" }),
      ]),
    );
  });

  it("401 when no token provided", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .send({ productId: new mongoose.Types.ObjectId().toHexString(), quantity: 1 });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token not Provided/i);
  });

  it("401 when token invalid", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer invalid.token.value")
      .send({ productId: new mongoose.Types.ObjectId().toHexString(), quantity: 1 });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("403 when role not allowed", async () => {
    const { token } = buildToken({ role: "seller" });
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: new mongoose.Types.ObjectId().toHexString(), quantity: 1 });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
  });
});
