const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

async function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id).lean();

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    delete user.password;
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = {
  authMiddleware
};
