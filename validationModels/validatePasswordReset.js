// validationModels/validateAuth.js
import Joi from "joi";
import passwordComplexity from "../common/validate.js";

// ✅ Validate Password Reset (token + new password)
const validatePasswordReset = (data) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      "any.required": "Reset token is required.",
      "string.empty": "Reset token cannot be empty.",
    }),
    newPassword: passwordComplexity.required().messages({
      "any.required": "New password is required.",
      "string.empty": "New password cannot be empty.",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

// ✅ Validate Email (for forgot password)
const validateEmail = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Valid email is required.",
      "any.required": "Email is required.",
      "string.empty": "Email cannot be empty.",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

// ✅ Validate Reset Token Only
const validateResetToken = (data) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      "any.required": "Token is required.",
      "string.empty": "Token cannot be empty.",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

export default {
  validatePasswordReset,
  validateEmail,
  validateResetToken,
};
