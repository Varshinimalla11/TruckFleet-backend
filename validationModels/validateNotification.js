import Joi from "joi";
import { objectId } from "../common/validateObjectId.js";

const validateNotification = (notification) => {
  const schema = Joi.object({
    user_id: objectId().required().messages({
      "any.required": "User ID is required.",
      "string.pattern.name": "User ID must be a valid ObjectId.",
    }),
    title: Joi.string().trim().max(100).messages({
      "string.base": "Title must be a string.",
      "string.max": "Title cannot exceed 100 characters.",
    }),
    message: Joi.string().trim().required().messages({
      "any.required": "Message is required.",
      "string.empty": "Message cannot be empty.",
    }),
    type: Joi.string()
      .valid("info", "warning", "error", "success")
      .default("info")
      .messages({
        "any.only": "Type must be one of: info, warning, error, success.",
      }),
    seen: Joi.boolean().messages({
      "boolean.base": "Seen must be a boolean value.",
    }),
    created_at: Joi.date().messages({
      "date.base": "Created At must be a valid date.",
    }),
  });

  return schema.validate(notification, { abortEarly: false });
};

export { validateNotification };

