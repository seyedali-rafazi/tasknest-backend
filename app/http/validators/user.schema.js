const Joi = require("joi");
const createHttpError = require("http-errors");

const getOtpSchema = Joi.object({
  phoneNumber: Joi.string()
    .length(11)
    .pattern(/^09[0-9]{9}$/)
    .error(
      createHttpError.BadRequest("The mobile number entered is not correct")
    ),
});

const checkOtpSchema = Joi.object({
  otp: Joi.string()
    .min(5)
    .max(6)
    .error(createHttpError.BadRequest("The code sent is not valid")),
  phoneNumber: Joi.string()
    .length(11)
    .pattern(/^09[0-9]{9}$/)
    .error(
      createHttpError.BadRequest("The mobile number entered is not correct")
    ),
});

const completeProfileSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .error(createHttpError.BadRequest("The username entered is not correct")),
  email: Joi.string()
    .email()
    .error(createHttpError.BadRequest("The email entered is not valid")),
  role: Joi.string()
    .required()
    .valid("FREELANCER", "OWNER")
    .error(createHttpError.BadRequest("The email entered is not valid")),
});

const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(5)
    .max(50)
    .required()
    .error(createHttpError.BadRequest("The username entered is not correct")),
  email: Joi.string()
    .required()
    .email()
    .error(createHttpError.BadRequest("The email entered is not valid")),
  phoneNumber: Joi.string()
    .length(11)
    .pattern(/^09[0-9]{9}$/)
    .error(
      createHttpError.BadRequest("The mobile number entered is not correct")
    ),
  biography: Joi.string()
    .max(30)
    .allow("")
    .error(
      createHttpError.BadRequest("The field of expertise is not correct.")
    ),
});

module.exports = {
  getOtpSchema,
  completeProfileSchema,
  checkOtpSchema,
  updateProfileSchema,
};
