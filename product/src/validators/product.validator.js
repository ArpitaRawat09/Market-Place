const { body, validationResult } = require("express-validator");

const handleValidationError = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const createValidateProductors = [
  body("title").notEmpty().withMessage("title is required"),
  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("description must be a string with maximum 500 characters")
    .withMessage("description is required"),
  body("priceAmount")
    .notEmpty()
    .withMessage("priceAmount is required")
    .bail()
    .isFloat()
    .withMessage("priceAmount must be a number"),
  body("priceCurrency").notEmpty().withMessage("priceCurrency is required"),
  handleValidationError,
];

module.exports = { createValidateProductors };
