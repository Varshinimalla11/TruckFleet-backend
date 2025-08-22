import Joi from "joi";
import { objectId } from "../common/validateObjectId.js";

function validateTruck(truck) {
  const schema = Joi.object({
    plate_number: Joi.string().required().messages({
      "any.required": "Plate number is required",
    }),
    condition: Joi.string()
      .valid("active", "maintenance_needed", "in_maintenance", "inactive")
      .required()
      .messages({
        "any.only":
          "Condition must be one of 'active', 'maintenance_needed', 'in_maintenance', or 'inactive'",
        "any.required": "Condition is required",
      }),
    mileage_factor: Joi.number().required().messages({
      "any.required": "Mileage factor is required",
    }),
    // owner_id: objectId.required().messages({
    //   "any.required": "Owner ID is required",
    //   "any.invalid": "Owner ID must be a valid ObjectId",
    // }),
  });
  return schema.validate(truck);
}

export {validateTruck};
