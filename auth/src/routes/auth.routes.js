const express = require("express");
const validator = require("../middlewares/validator.middleware");
const authController = require("../controller/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// POST/auth/register
router.post(
  "/register",
  validator.registerUserValidationRules,
  authController.registerUser
);

// POST/auth/login
router.post(
  "/login",
  validator.loginUserValidationRules,
  authController.loginUser
);

// GET /auth/me
router.get("/me", authMiddleware.authMiddleware, authController.getCurrentUser);

//GET /auth/logout
router.get("/logout", authMiddleware.authMiddleware, authController.logoutUser);

router.get(
  "/users/me/addresses",
  authMiddleware.authMiddleware,
  authController.getUserAddresses
);

router.post  (
  "/users/me/addresses",
  validator.addUserValidation,
  authMiddleware.authMiddleware,
  authController.addUserAddress
);

router.delete(
  "/users/me/addresses/:addressId",
  authMiddleware.authMiddleware,
  authController.deleteUserAddress
);
module.exports = router;


