const { body, validationResult } = require("express-validator");

const respondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const createOrderValidation = [
  body("shippingAddress.street")
    .isString()
    .withMessage("Street is required")
    .notEmpty()
    .withMessage("Street cannot be empty"),
  body("shippingAddress.city")
    .isString()
    .withMessage("City is required")
    .notEmpty()
    .withMessage("City cannot be empty"),
  body("shippingAddress.state")
    .isString()
    .withMessage("State is required")
    .notEmpty()
    .withMessage("State cannot be empty"),
  body("shippingAddress.country")
    .isString()
    .withMessage("Country is required")
    .notEmpty()
    .withMessage("Country cannot be empty"),
  body('shippingAddress.pincode')
        .isString()
        .withMessage('Pincode must be a string')
        .notEmpty()
        .withMessage('Pincode is required')
        .bail()
        .matches(/^\d{4,}$/)
        .withMessage('Pincode must be at least 4 digits'),
  respondWithValidationErrors,
];

const updateAddressValidation = [
  body("shippingAddress.street")
    .isString()
    .withMessage("Street is required")
    .notEmpty()
    .withMessage("Street cannot be empty"),
  body("shippingAddress.city")
    .isString()
    .withMessage("City is required")
    .notEmpty()
    .withMessage("City cannot be empty"),
  body("shippingAddress.state")
    .isString()
    .withMessage("State is required")
    .notEmpty()
    .withMessage("State cannot be empty"),
  body("shippingAddress.country")
    .isString()
    .withMessage("Country is required")
    .notEmpty()
    .withMessage("Country cannot be empty"),
  body("shippingAddress.pincode")
    .isString()
    .withMessage("Pincode must be a string")
    .notEmpty()
    .withMessage("Pincode is required")
    .bail()
    .matches(/^\d{4,}$/)
    .withMessage("Pincode must be at least 4 digits"),
  respondWithValidationErrors,
];

module.exports = {
  createOrderValidation,
  updateAddressValidation,
};
