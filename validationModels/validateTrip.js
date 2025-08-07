const Joi = require("joi");
const mongoose = require("mongoose");
const { objectId } = require("../common/validateObjectId");

function validateTrip(trip) {
  const schema = Joi.object({
    truck_id: objectId.required().messages({
      "any.required": "Truck ID is required",
      "any.invalid": "Truck ID must be a valid ObjectId",
    }),

    driver_id: objectId.required().messages({
      "any.required": "Driver ID is required",
      "any.invalid": "Driver ID must be a valid ObjectId",
    }),
    driver_snapshot: Joi.object({
      name: Joi.string().trim().required().messages({
        "string.base": "Driver name must be a string",
        "string.empty": "Driver name is required",
        "any.required": "Driver name is required",
      }),

      phone: Joi.string()
        .pattern(/^\d{10}$/)
        .required()
        .messages({
          "string.pattern.base": "Phone number must be 10 digits",
          "string.empty": "Driver phone is required",
          "any.required": "Driver phone is required",
        }),

      aadhar_number: Joi.string()
        .length(12)
        .pattern(/^\d+$/)
        .required()
        .messages({
          "string.length": "Aadhaar number must be 12 digits",
          "string.pattern.base": "Aadhaar number must be numeric",
          "any.required": "Aadhaar number is required",
        }),

      license_number: Joi.string().trim().required().messages({
        "string.base": "License number must be a string",
        "string.empty": "License number is required",
        "any.required": "License number is required",
      }),
    })
      .required()
      .messages({
        "any.required": "Driver snapshot is required",
      }),

    start_city: Joi.string().trim().required().messages({
      "string.base": "Start city must be a string",
      "string.empty": "Start city cannot be empty",
      "any.required": "Start city is required",
    }),

    end_city: Joi.string().trim().required().messages({
      "string.base": "End city must be a string",
      "string.empty": "End city cannot be empty",
      "any.required": "End city is required",
    }),

    total_km: Joi.number().min(0).required().messages({
      "number.base": "Total kilometers must be a number",
      "number.min": "Total kilometers cannot be negative",
      "any.required": "Total kilometers is required",
    }),

    cargo_weight: Joi.number().min(0).required().messages({
      "number.base": "Cargo weight must be a number",
      "number.min": "Cargo weight cannot be negative",
      "any.required": "Cargo weight is required",
    }),

    fuel_start: Joi.number().min(0).required().messages({
      "number.base": "Fuel at start must be a number",
      "number.min": "Fuel at start cannot be negative",
      "any.required": "Fuel at start is required",
    }),

    start_time: Joi.date().required().messages({
      "date.base": "Start time must be a valid date",
      "any.required": "Start time is required",
    }),

    end_time: Joi.date().optional().messages({
      "date.base": "End time must be a valid date",
    }),

    status: Joi.string()
      .valid("scheduled", "ongoing", "completed", "cancelled")
      .default("scheduled")
      .messages({
        "string.base": "Status must be a string",
        "any.only":
          "Status must be one of 'ongoing', 'completed', or 'cancelled'",
      }),
  });

  return schema.validate(trip);
}

exports.validateTrip = validateTrip;
