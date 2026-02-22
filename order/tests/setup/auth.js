const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const ensureJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret';
  }
};

const getAuthCookie = () => {
  ensureJwtSecret();
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toHexString(), role: 'user' },
    process.env.JWT_SECRET,
  );
  return `token=${token}`;
};

module.exports = { getAuthCookie };
