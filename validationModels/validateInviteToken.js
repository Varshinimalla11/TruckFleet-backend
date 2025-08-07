const Joi = require("joi");

function validateInviteToken(data) {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      "string.empty": "Token is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    owner: Joi.objectId().required().messages({
      "any.required": "Owner ID is required",
      "string.pattern.name": "Invalid owner ID",
    }),
    expiresAt: Joi.date().greater("now").optional().messages({
      "date.greater": "Expiry time must be in the future",
    }),
    isUsed: Joi.boolean().optional(),
  });

  return schema.validate(data);
}

module.exports = validateInviteToken;
