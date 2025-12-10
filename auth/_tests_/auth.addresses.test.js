const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");

describe("User addresses API", () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  const createAuthCookieForUser = (user) => {
    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return [`token=${token}`];
  };

  it("GET /api/auth/users/me/addresses - lists saved addresses and has a default one", async () => {
    const user = await User.create({
      username: "addr_get_user",
      email: "addr_get@example.com",
      password: "hashed-password",
      fullName: { firstName: "Addr", lastName: "Getter" },
      address: [
        {
          street: "123 Main St",
          city: "Metropolis",
          state: "StateOne",
          country: "IN",
          pincode: "560001",
          isDefault: true
        },
        {
          street: "456 Second St",
          city: "Metropolis",
          state: "StateOne",
          country: "IN",
          pincode: "560002",
          isDefault: true
        }
      ]
    });

    const cookie = createAuthCookieForUser(user);

    const res = await request(app)
      .get("/api/auth/users/me/addresses")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.addresses)).toBe(true);
    expect(res.body.addresses.length).toBe(2);

    const defaultAddresses = res.body.addresses.filter((a) => a.isDefault);
    expect(defaultAddresses.length).toBe(1);
  });

  it("POST /api/auth/users/me/addresses - adds a new address with valid pincode and phone", async () => {
    const user = await User.create({
      username: "addr_post_user",
      email: "addr_post@example.com",
      password: "hashed-password",
      fullName: { firstName: "Addr", lastName: "Poster" },
      address: []
    });

    const cookie = createAuthCookieForUser(user);

    const payload = {
      street: "789 Third St",
      city: "Gotham",
      state: "StateTwo",
      country: "IN",
      pincode: "560003",
      phone: "9876543212",
      isDefault: true
    };

    const res = await request(app)
      .post("/api/auth/users/me/addresses")
      .set("Cookie", cookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.addresses)).toBe(true);
    expect(res.body.addresses.length).toBe(1);

    const saved = res.body.addresses[0];
    expect(saved.street).toBe(payload.street);
    expect(saved.city).toBe(payload.city);
    expect(saved.state).toBe(payload.state);
    expect(saved.country).toBe(payload.country);
    expect(saved.pincode).toBe(payload.pincode);
    expect(saved.phone).toBe(payload.phone);
    expect(saved.isDefault).toBe(true);
  });

  it("POST /api/auth/users/me/addresses - fails validation for invalid pincode or phone", async () => {
    const user = await User.create({
      username: "addr_invalid_user",
      email: "addr_invalid@example.com",
      password: "hashed-password",
      fullName: { firstName: "Addr", lastName: "Invalid" },
      address: []
    });

    const cookie = createAuthCookieForUser(user);

    const invalidPayload = {
      street: "12 Bad St",
      city: "Nowhere",
      state: "NA",
      country: "IN",
      pincode: "12", // clearly invalid
      phone: "123" // clearly invalid
    };

    const res = await request(app)
      .post("/api/auth/users/me/addresses")
      .set("Cookie", cookie)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    // assuming express-validator-style response
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("DELETE /api/auth/users/me/addresses/:addressId - removes an existing address", async () => {
    const user = await User.create({
      username: "addr_delete_user",
      email: "addr_delete@example.com",
      password: "hashed-password",
      fullName: { firstName: "Addr", lastName: "Deleter" },
      address: [
        {
          street: "1 Delete Me",
          city: "CityOne",
          state: "ST1",
          country: "IN",
          pincode: "560010",
          phone: "9876543213",
          isDefault: true
        },
        {
          street: "2 Keep Me",
          city: "CityOne",
          state: "ST1",
          country: "IN",
          pincode: "560011",
          phone: "9876543214",
          isDefault: false
        }
      ]
    });

    const cookie = createAuthCookieForUser(user);

    const addressIdToDelete = user.address[0]._id.toString();

    const res = await request(app)
      .delete(`/api/auth/users/me/addresses/${addressIdToDelete}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);

    // Optionally verify remaining addresses from response or DB
    if (Array.isArray(res.body.addresses)) {
      expect(res.body.addresses.length).toBe(1);
      expect(res.body.addresses[0].street).toBe("2 Keep Me");
    }
  });
});
