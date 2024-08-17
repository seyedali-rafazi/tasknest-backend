const createError = require("http-errors");
const Joi = require("joi");
const { MongoIDPattern } = require("../../../utils/constants");

const addProjectSchema = Joi.object({
  title: Joi.string()
    .required()
    .min(3)
    .max(100)
    .error(createError.BadRequest("The title of the product is not correct")),
  description: Joi.string()
    .required()
    .error(createError.BadRequest("The description sent is not correct")),
  tags: Joi.array()
    .min(0)
    .max(20)
    .error(createError.BadRequest("Tags cannot be more than 20 items")),
  category: Joi.string()
    .required()
    .regex(MongoIDPattern)
    .error(createError.BadRequest("The desired category is not correct")),
  budget: Joi.number().error(
    createError.BadRequest("The entered price is not correct")
  ),
  deadline: Joi.date()
    .required()
    .error(createError.BadRequest("Enter the project deadline")),
});

module.exports = {
  addProjectSchema,
};
