const Joi = require("joi");
const passwordComplexity = require("../common/validate");

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
      "string.base": "Name must be a string",
      "string.empty": "Name is required",
      "string.min": "Name must be at least 3 characters",
      "string.max": "Name must be at most 50 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),
    phone: Joi.string()
      .pattern(/^\d{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be 10 digits",
        "any.required": "Phone number is required",
      }),
    password: passwordComplexity.required().messages({
      "any.required": "Password is required",
    }),
    role: Joi.string().valid("admin", "owner", "driver").required().messages({
      "any.only": "Role must be one of 'admin', 'owner', or 'driver'",
      "any.required": "Role is required",
    }),
    ownedBy: Joi.when("role", {
      is: "driver",
      then: Joi.objectId().required().messages({
        "any.required": "OwnedBy is required for drivers",
        "string.pattern.name": "OwnedBy must be a valid ObjectId",
      }),
      otherwise: Joi.forbidden(),
    }),
    aadhar_number: Joi.when("role", {
      is: "driver",
      then: Joi.string()
        .pattern(/^\d{12}$/)
        .required()
        .messages({
          "string.pattern.base": "Aadhaar must be exactly 12 digits",
          "any.required": "Aadhaar number is required for drivers",
        }),
      otherwise: Joi.forbidden(),
    }),

    license_number: Joi.when("role", {
      is: "driver",
      then: Joi.string().trim().required().messages({
        "string.empty": "License number is required for drivers",
      }),
      otherwise: Joi.forbidden(),
    }),
  });

  return schema.validate(user);
}

exports.validateUser = validateUser;
