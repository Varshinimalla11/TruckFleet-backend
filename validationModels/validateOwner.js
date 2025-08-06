// const Joi = require("joi");
// const passwordComplexity = require("../common/validate");

// function validateOwner(owner) {
//   const schema = Joi.object({
//     name: Joi.string().min(3).max(50).required(),
//     email: Joi.string().email().required().messages({
//       "string.email": "Email must be a valid email address",
//       "any.required": "Email is required",
//     }),
//     phone: Joi.string()
//       .pattern(/^\d{10}$/)
//       .required()
//       .messages({
//         "string.pattern.base": "Phone number must be 10 digits",
//         "any.required": "Phone number is required",
//       }),
//     password: passwordComplexity.required().messages({
//       "any.required": "Password is required",
//     }),
//   });

//   return schema.validate(owner);
// }

// exports.validateOwner = validateOwner;
