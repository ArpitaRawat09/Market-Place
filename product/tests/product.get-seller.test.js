const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../src/services/imagekit.service', () => ({
  uploadImage: jest.fn(),
}));

const app = require('../src/app');
const Product = require('../src/models/product.model');

describe('GET /api/products/seller (SELLER)', () => {
  let mongo;
  let sellerId;
  let otherSellerId;

  const signToken = (id, role = 'seller') => jwt.sign({ id, role }, process.env.JWT_SECRET);

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    await mongoose.connect(uri);
    await Product.syncIndexes();

    sellerId = new mongoose.Types.ObjectId();
    otherSellerId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) await c.deleteMany({});
  });

  it('requires authentication (401) when no token provided', async () => {
    const res = await request(app).get('/api/products/seller');
    expect(res.status).toBe(401);
  });

  it('requires seller role (403) when role is not seller', async () => {
    const token = signToken(sellerId.toHexString(), 'user');
    const res = await request(app)
      .get('/api/products/seller')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  const createProduct = (overrides = {}) =>
    Product.create({
      title: overrides.title ?? 'Sample Item',
      description: overrides.description ?? 'Sample description',
      price: overrides.price ?? { amount: 10, currency: 'USD' },
      seller: overrides.seller ?? sellerId,
      images: overrides.images ?? [],
    });

  it('lists only products owned by the authenticated seller', async () => {
    await Promise.all([
      createProduct({ title: 'Seller Item 1' }),
      createProduct({ title: 'Seller Item 2' }),
      createProduct({ title: 'Other Seller Item', seller: otherSellerId }),
    ]);

    const token = signToken(sellerId.toHexString());
    const res = await request(app)
      .get('/api/products/seller')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.data).toHaveLength(2);
    const titles = res.body.data.map((p) => p.title).sort();
    expect(titles).toEqual(['Seller Item 1', 'Seller Item 2']);
    expect(res.body.data.every((p) => p.seller === sellerId.toHexString())).toBe(true);
  });

  it('supports pagination with skip and limit', async () => {
    const docs = await Product.insertMany([
      { title: 'Item 1', description: 'First', price: { amount: 10, currency: 'USD' }, seller: sellerId },
      { title: 'Item 2', description: 'Second', price: { amount: 20, currency: 'USD' }, seller: sellerId },
      { title: 'Item 3', description: 'Third', price: { amount: 30, currency: 'USD' }, seller: sellerId },
      { title: 'Item 4', description: 'Fourth', price: { amount: 40, currency: 'USD' }, seller: sellerId },
    ]);

    const token = signToken(sellerId.toHexString());
    const res = await request(app)
      .get('/api/products/seller')
      .query({ skip: 1, limit: 2 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.data).toHaveLength(2);
    const ids = res.body.data.map((p) => p._id);
    expect(ids).toEqual([docs[1]._id.toString(), docs[2]._id.toString()]);
  });
});
