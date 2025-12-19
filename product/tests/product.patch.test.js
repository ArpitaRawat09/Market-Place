const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../src/services/imagekit.service', () => ({
  uploadImage: jest.fn(),
}));

const app = require('../src/app');
const Product = require('../src/models/product.model');

describe('PATCH /api/products/:id', () => {
  let mongo;
  let jwtSecret;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    jwtSecret = process.env.JWT_SECRET || 'testsecret';
    process.env.JWT_SECRET = jwtSecret;
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  const createToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET);

  it('returns 401 when token is missing', async () => {
    const res = await request(app)
      .patch(`/api/products/${new mongoose.Types.ObjectId().toHexString()}`)
      .send({ title: 'Update attempt' });

    expect(res.status).toBe(401);
    expect(res.body?.message).toMatch(/unauthorized/i);
  });

  it('returns 403 when role is not seller', async () => {
    const token = createToken({ id: new mongoose.Types.ObjectId().toHexString(), role: 'user' });

    const res = await request(app)
      .patch(`/api/products/${new mongoose.Types.ObjectId().toHexString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Update attempt' });

    expect(res.status).toBe(403);
    expect(res.body?.message).toMatch(/forbidden/i);
  });

  it('returns 400 for invalid object id', async () => {
    const token = createToken({ id: new mongoose.Types.ObjectId().toHexString(), role: 'seller' });

    const res = await request(app)
      .patch('/api/products/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New title' });

    expect(res.status).toBe(400);
    expect(res.body?.message).toBe('Invalid product id');
  });

  it('returns 404 when product not found', async () => {
    const token = createToken({ id: new mongoose.Types.ObjectId().toHexString(), role: 'seller' });

    const res = await request(app)
      .patch(`/api/products/${new mongoose.Types.ObjectId().toHexString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New title' });

    expect(res.status).toBe(404);
    expect(res.body?.message).toBe('Product not found');
  });

  it("returns 403 when trying to update another seller's product", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherSellerToken = createToken({ id: new mongoose.Types.ObjectId().toHexString(), role: 'seller' });

    const product = await Product.create({
      title: 'Owner Product',
      description: 'Product belonging to another seller',
      price: { amount: 99, currency: 'USD' },
      seller: ownerId,
    });

    const res = await request(app)
      .patch(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${otherSellerToken}`)
      .send({ title: 'Hacked title' });

    expect(res.status).toBe(403);
    expect(res.body?.message).toMatch(/forbidden/i);
  });

  it('updates product fields for owning seller', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = createToken({ id: sellerId.toHexString(), role: 'seller' });

    const product = await Product.create({
      title: 'Gaming Console',
      description: 'Latest gen console',
      price: { amount: 499, currency: 'USD' },
      seller: sellerId,
    });

    const payload = {
      title: 'Gaming Console Pro',
      description: 'Latest gen console with VR bundle',
      price: { amount: 549, currency: 'USD' },
    };

    const res = await request(app)
      .patch(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe(payload.title);
    expect(res.body?.data?.description).toBe(payload.description);
    expect(res.body?.data?.price?.amount).toBe(payload.price.amount);
    expect(res.body?.data?.price?.currency).toBe(payload.price.currency);

    const refreshed = await Product.findById(product.id);
    expect(refreshed.title).toBe(payload.title);
    expect(refreshed.description).toBe(payload.description);
    expect(refreshed.price.amount).toBe(payload.price.amount);
    expect(refreshed.price.currency).toBe(payload.price.currency);
  });
});
