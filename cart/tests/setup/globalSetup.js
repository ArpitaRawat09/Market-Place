const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  global.__MONGO_SERVER__ = mongoServer;
  global.__MONGO_URI__ = uri;
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
};
