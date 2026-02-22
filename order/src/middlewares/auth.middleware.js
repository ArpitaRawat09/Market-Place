const jwt = require("jsonwebtoken");

function createAuthMiddleware(role = ["user"]) {
  return function authMiddleware(req, res, next) {
    const token =
      req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized : Token not Provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!role.includes(decoded.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden : Insufficient Permissions" });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

module.exports = createAuthMiddleware;
