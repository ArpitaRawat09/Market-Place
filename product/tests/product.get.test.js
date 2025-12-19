const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../src/services/imagekit.service', () => ({
  uploadImage: jest.fn(),
}));

const app = require('../src/app');
const Product = require('../src/models/product.model');

describe('GET /api/products', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    await mongoose.connect(uri);
    await Product.syncIndexes();
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

  const seedProducts = async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const docs = [
      {
        title: 'Budget Phone',
        description: 'Affordable smartphone with basic features',
        price: { amount: 199, currency: 'USD' },
        seller: sellerId,
      },
      {
        title: 'Ultra Laptop',
        description: 'High performance laptop for professionals',
        price: { amount: 1299, currency: 'USD' },
        seller: sellerId,
      },
      {
        title: 'Travel Camera',
        description: 'Compact camera perfect for travel photography',
        price: { amount: 549, currency: 'USD' },
        seller: sellerId,
      },
    ];

    const created = await Product.insertMany(docs, { ordered: true });
    return created.map((doc) => doc.toObject());
  };

  it('returns all products when no filters are provided', async () => {
    await seedProducts();

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body.data).toHaveLength(3);
  });

  it('filters products by text search', async () => {
    const products = await seedProducts();

    const res = await request(app)
      .get('/api/products')
      .query({ q: 'laptop' });

    expect(res.status).toBe(200);
    expect(res.body?.data).toHaveLength(1);
    expect(res.body.data[0]?.title).toBe(products[1].title);
  });

  it('filters products by price range', async () => {
    await seedProducts();

    const res = await request(app)
      .get('/api/products')
      .query({ minPrice: 500, maxPrice: 1500 });

    expect(res.status).toBe(200);
    expect(res.body?.data).toHaveLength(2);
    const titles = res.body.data.map((p) => p.title).sort();
    expect(titles).toEqual(['Travel Camera', 'Ultra Laptop']);
  });

  it('supports skip and limit pagination', async () => {
    const products = await seedProducts();

    const res = await request(app)
      .get('/api/products')
      .query({ skip: 1, limit: 1 });

    expect(res.status).toBe(200);
    expect(res.body?.data).toHaveLength(1);
    expect(res.body.data[0]?._id).toBe(products[1]._id.toString());
  });
});
