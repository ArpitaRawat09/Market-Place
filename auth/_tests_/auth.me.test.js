const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");

describe("GET /api/auth/me", () => {
  let token;
  let user;

  beforeAll(async () => {
    await User.syncIndexes();

    user = await User.create({
      username: "meuser",
      email: "meuser@example.com",
      password: "hashed-does-not-matter",
      fullName: { firstName: "Me", lastName: "User" }
    });

    token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  it("returns authenticated user details when token cookie is valid", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toMatchObject({
      id: user._id.toString(),
      username: "meuser",
      email: "meuser@example.com"
    });
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects requests without an auth token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    // Update to match your eventual payload
    // expect(res.body).toEqual({ message: "Authentication required" });
  });

  it("rejects requests when token is invalid", async () => {
    const invalidToken = `${token}invalid`;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${invalidToken}`]);

    expect(res.status).toBe(401);
    // Update to match your eventual payload
    // expect(res.body).toEqual({ message: "Invalid token" });
  });
});
