const Joi = require("joi");
const { objectId } = require("../common/validateObjectId");

const validateNotification = (notification) => {
  const schema = Joi.object({
    user_id: objectId().required().messages({
      "any.required": "User ID is required.",
      "string.pattern.name": "User ID must be a valid ObjectId.",
    }),
    message: Joi.string().trim().required().messages({
      "any.required": "Message is required.",
      "string.empty": "Message cannot be empty.",
    }),
    seen: Joi.boolean().messages({
      "boolean.base": "Seen must be a boolean value.",
    }),
    created_at: Joi.date().messages({
      "date.base": "Created At must be a valid date.",
    }),
  });

  return schema.validate(notification);
};

exports.validateNotification = validateNotification;
