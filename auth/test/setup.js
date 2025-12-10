const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	const uri = mongo.getUri();

	// process.env.NODE_ENV = "test";
	process.env.MONGO_URI = uri;
	process.env.JWT_SECRET = "test_jwt_secret";

	await mongoose.connect(uri);
});

afterEach(async () => {
	const collections = await mongoose.connection.db.collections();
	for (const collection of collections) {
		await collection.deleteMany({});
	}
});

afterAll(async () => {
	await mongoose.connection.close();
	if (mongo) {
		await mongo.stop();
	}
});
