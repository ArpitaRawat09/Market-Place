const { body, validationResult } = require("express-validator");

const respondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerUserValidationRules = [
  body("username")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("fullName.firstName")
    .isString()
    .withMessage("First name is required")
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("fullName.lastName")
    .isString()
    .withMessage("Last name is required")
    .notEmpty()
    .withMessage("Last name cannot be empty"),
    body("role")
    .optional()
    .isIn(["user", "seller"])
    .withMessage("Role must be either 'user' or 'seller'"),
  respondWithValidationErrors,
];

const loginUserValidationRules = [
  body("email").optional().isEmail().withMessage("Invalid email address"),
  body("username").optional().isString().withMessage("Invalid username"),
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  (req, res, next) => {
    if (!req.body.email && !req.body.username) {
      return res
        .status(400)
        .json({ message: "Email or username is required for login" });
    }
    respondWithValidationErrors(req, res, next);
  },
];

const addUserValidation = [
  body("street")
    .isString()
    .withMessage("Street is required")
    .notEmpty()
    .withMessage("Street cannot be empty"),
  body("city")
    .isString()
    .withMessage("City is required")
    .notEmpty()
    .withMessage("City cannot be empty"),
  body("state")
    .isString()
    .withMessage("State is required")
    .notEmpty()
    .withMessage("State cannot be empty"),
  body("country")
    .isString()
    .withMessage("Country is required")
    .notEmpty()
    .withMessage("Country cannot be empty"),
  body("pincode").isPostalCode("IN").withMessage("Invalid pincode for India"),
  body("phone")
    .isString()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be a valid 10-digit number"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean value"),
  respondWithValidationErrors,
];

module.exports = {
  registerUserValidationRules,
  loginUserValidationRules,
  addUserValidation,
};
