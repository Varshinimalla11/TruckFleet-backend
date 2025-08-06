const Joi = require("joi");
const mongoose = require("mongoose");
const { objectId } = require("../common/validateObjectId");

const validateRefuelEvent = (data) => {
  const schema = Joi.object({
    trip_id: objectId.required().messages({
      "any.required": "Trip ID is required.",
      "any.invalid": "Trip ID must be a valid ObjectId.",
    }),

    event_time: Joi.date().required().messages({
      "any.required": "Event time is required.",
      "date.base": "Event time must be a valid date.",
    }),

    fuel_before: Joi.number().min(0).required().messages({
      "any.required": "Fuel before is required.",
      "number.base": "Fuel before must be a number.",
      "number.min": "Fuel before must be 0 or more.",
    }),

    fuel_added: Joi.number().min(0).required().messages({
      "any.required": "Fuel added is required.",
      "number.base": "Fuel added must be a number.",
      "number.min": "Fuel added must be 0 or more.",
    }),

    fuel_after: Joi.number().min(0).required().messages({
      "any.required": "Fuel after is required.",
      "number.base": "Fuel after must be a number.",
      "number.min": "Fuel after must be 0 or more.",
    }),

    payment_mode: Joi.string()
      .valid("cash", "card", "upi", "other")
      .optional()
      .messages({
        "string.base": "Payment mode must be a string.",
        "any.only": "Payment mode must be one of: cash, card, upi, other.",
      }),
  });

  return schema.validate(data);
};

module.exports = validateRefuelEvent;
