const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../src/services/imagekit.service', () => ({
  uploadImage: jest.fn(),
}));

const app = require('../src/app');
const Product = require('../src/models/product.model');

describe('GET /api/products/:id', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
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

  it('returns 400 for invalid object id', async () => {
    const res = await request(app).get('/api/products/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body?.message).toBe('Invalid product id');
  });

  it('returns 404 when product not found', async () => {
    const res = await request(app).get(
      `/api/products/${new mongoose.Types.ObjectId().toHexString()}`
    );

    expect(res.status).toBe(404);
    expect(res.body?.message).toBe('Product not found');
  });

  it('returns product when found', async () => {
    const product = await Product.create({
      title: 'Noise Cancelling Headphones',
      description: 'Wireless over-ear headphones with ANC',
      price: { amount: 299, currency: 'USD' },
      seller: new mongoose.Types.ObjectId(),
    });

    const res = await request(app).get(`/api/products/${product.id}`);

    expect(res.status).toBe(200);
    expect(res.body?.data?._id).toBe(product.id);
    expect(res.body?.data?.title).toBe('Noise Cancelling Headphones');
  });
});
