const Joi = require("joi");
const mongoose = require("mongoose");
const { objectId } = require("../common/validateObjectId");

function validateDriveSession(driveSession) {
  const schema = Joi.object({
    trip_id: objectId.required().messages({
      "any.required": "Trip ID is required",
      "any.invalid": "Trip ID must be a valid ObjectId",
    }),

    start_time: Joi.date().required().messages({
      "date.base": "Start time must be a valid date",
      "any.required": "Start time is required",
    }),

    end_time: Joi.date().required().messages({
      "date.base": "End time must be a valid date",
      "any.required": "End time is required",
    }),

    fuel_used: Joi.number().min(0).optional().messages({
      "number.base": "Fuel used must be a number",
      "number.min": "Fuel used cannot be negative",
    }),

    km_covered: Joi.number().min(0).optional().messages({
      "number.base": "KM covered must be a number",
      "number.min": "KM covered cannot be negative",
    }),
  });

  return schema.validate(driveSession);
}

module.exports = validateDriveSession;
