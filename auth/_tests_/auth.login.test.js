const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const User = require("../src/models/user.model");

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  it("logs in with email and returns sanitized user", async () => {
    const password = "Secret123!";

    await User.create({
      username: "loginuser",
      email: "login@example.com",
      password: await bcrypt.hash(password, 10),
      fullName: { firstName: "Login", lastName: "User" }
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "Login successful",
      user: {
        username: "loginuser",
        email: "login@example.com"
      }
    });
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("allows logging in with username", async () => {
    const password = "Secret123!";

    await User.create({
      username: "useralias",
      email: "alias@example.com",
      password: await bcrypt.hash(password, 10),
      fullName: { firstName: "Alias", lastName: "User" }
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "useralias", password });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: "useralias",
      email: "alias@example.com"
    });
  });

  it("rejects invalid password", async () => {
    await User.create({
      username: "badpass",
      email: "badpass@example.com",
      password: await bcrypt.hash("Correct123!", 10),
      fullName: { firstName: "Bad", lastName: "Pass" }
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "badpass@example.com", password: "Wrong123!" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid password" });
  });

  it("requires an email or username", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "Secret123!" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Email or username is required for login" });
  });
});
