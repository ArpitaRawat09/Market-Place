const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");
const redisClient = require("../src/db/redis");

describe("GET /api/auth/logout", () => {
  let token;
  let user;
  let redisSetSpy;

  beforeAll(async () => {
    await User.syncIndexes();

    user = await User.create({
      username: "logoutuser",
      email: "logout@example.com",
      password: "hashed-password",
      fullName: { firstName: "Log", lastName: "Out" }
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

  beforeEach(() => {
    redisSetSpy = jest.spyOn(redisClient, "set").mockResolvedValue("OK");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("blacklists the token and clears the cookie when provided a valid session", async () => {
    const res = await request(app)
      .get("/api/auth/logout")
      .set("Cookie", [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"].join(";")).toContain("token=");
    expect(redisSetSpy).toHaveBeenCalledWith(`blacklist_${token}`, true, "EX", 26 * 60 * 60);
  });

  it("rejects logout attempts without a token", async () => {
    const res = await request(app).get("/api/auth/logout");

    expect(res.status).toBe(401);
  });

  it("rejects logout attempts with an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/logout")
      .set("Cookie", ["token=invalidtoken"]);

    expect(res.status).toBe(401);
  });
});
