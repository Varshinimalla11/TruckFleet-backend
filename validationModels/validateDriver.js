// const mongoose = require("mongoose");
// const Joi = require("joi");
// const passwordComplexity = require("../common/validate");

// function validateDriver(driver) {
//   const schema = Joi.object({
//     name: Joi.string().min(3).max(50).required(),
//     email: Joi.string().email().required().messages({
//       "string.email": "Email must be a valid email address",
//       "any.required": "Email is required",
//     }),
//     password: passwordComplexity.required().messages({
//       "any.required": "Password is required",
//     }),
//     ownerId: Joi.objectId().required().messages({
//       "any.required": "Owner ID is required",
//       "objectId.base": "Owner ID must be a valid ObjectId",
//     }),
//   });
//   return schema.validate(driver);
// }

// exports.validateDriver = validateDriver;
