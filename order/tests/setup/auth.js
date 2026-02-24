const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const ensureJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret";
  }
};

function getAuthCookie({
  userId = "69983069404394c4f742891d",
  extra = { role: "user" },
} = {}) {
  const secret = process.env.JWT_SECRET || "test-secret";
  const payload = { id: userId, ...extra };
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });
  const cookieName = process.env.JWT_COOKIE_NAME || "token";
  return [`${cookieName}=${token}`];
}

module.exports = { getAuthCookie };
