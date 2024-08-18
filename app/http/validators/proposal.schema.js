const createError = require("http-errors");
const Joi = require("joi");
const { MongoIDPattern } = require("../../../utils/constants");

const addProposalSchema = Joi.object({
  description: Joi.string()
    .required()
    .error(createError.BadRequest("The description sent is not correct")),
  price: Joi.number().error(
    createError.BadRequest("The entered price is not correct")
  ),
  duration: Joi.number()
    .required()
    .error(createError.BadRequest("Enter the project completion time")),
  projectId: Joi.string()
    .required()
    .regex(MongoIDPattern)
    .error(createError.BadRequest("The entered project ID is not correct")),
});

module.exports = {
  addProposalSchema,
};
