const Joi = require("joi");
const { objectId } = require("../common/validateObjectId");

function validateRestLog(restLog) {
  const schema = Joi.object({
    trip_id: objectId.required().messages({
      "any.required": "Trip ID is required",
      "any.invalid": "Trip ID must be a valid ObjectId",
    }),

    rest_start_time: Joi.date().required().messages({
      "date.base": "Rest start time must be a valid date",
      "any.required": "Rest start time is required",
    }),

    rest_end_time: Joi.date().optional().messages({
      "date.base": "Rest end time must be a valid date",
    }),

    fuel_at_rest_start: Joi.number().min(0).optional().messages({
      "number.base": "Fuel at rest start must be a number",
      "number.min": "Fuel at rest start cannot be negative",
    }),

    fuel_at_rest_end: Joi.number().min(0).optional().messages({
      "number.base": "Fuel at rest end must be a number",
      "number.min": "Fuel at rest end cannot be negative",
    }),
  });

  return schema.validate(restLog);
}

module.exports = validateRestLog;
