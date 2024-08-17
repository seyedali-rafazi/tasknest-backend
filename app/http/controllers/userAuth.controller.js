const bcrypt = require("bcrypt");

const Controller = require("./controller");
const {
  generateRandomNumber,
  setAccessToken,
  setRefreshToken,
  verifyRefreshToken,
} = require("../../../utils/functions");
const createError = require("http-errors");
const { UserModel } = require("../../models/user");
const { StatusCodes: HttpStatus } = require("http-status-codes");
const {
  completeProfileSchema,
  updateProfileSchema,
} = require("../validators/user.schema");

class userAuthController extends Controller {
  constructor() {
    super();
    this.phoneNumber = null;
    this.password = null;
  }

  async getOtp(req, res) {
    let { phoneNumber, password } = req.body;

    if (!phoneNumber || !password)
      throw createError.BadRequest("Enter valid mobile number and password");

    phoneNumber = phoneNumber.trim();
    this.phoneNumber = phoneNumber;
    this.code = generateRandomNumber(6);

    const user = await UserModel.findOne({ phoneNumber });
    if (!user) {
      // Create User if does not exist

      phoneNumber = phoneNumber.trim();
      this.phoneNumber = phoneNumber;

      const hashedPassword = await bcrypt.hash(password, 10);
      this.hashedPassword = hashedPassword;
      const user = await this.saveUser(phoneNumber, hashedPassword);
      await setAccessToken(res, user);
      await setRefreshToken(res, user);
      let WELLCOME_MESSAGE = `Registration done, welcome to TaskNest.‍`;

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: {
          message: WELLCOME_MESSAGE,
          user,
        },
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw createError.Unauthorized("The password is invalid.");
    await setAccessToken(res, user);
    await setRefreshToken(res, user);
    let WELLCOME_MESSAGE = `The code is approved, welcome to the TaskNest.`;
    if (!user.isActive)
      WELLCOME_MESSAGE = `The code has been verified, please complete your information`;

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: WELLCOME_MESSAGE,
        user,
      },
    });
  }

  async saveUser(phoneNumber, password) {
    return await UserModel.create({
      phoneNumber,
      password, // Save hashed password
    });
  }

  async checkUserExist(phoneNumber) {
    const user = await UserModel.findOne({ phoneNumber });
    return user;
  }
  async updateUser(phoneNumber, objectData = {}) {
    Object.keys(objectData).forEach((key) => {
      if (["", " ", 0, null, "0", NaN].includes(objectData[key]))
        delete objectData[key];
    });
    const updatedResult = await UserModel.updateOne(
      { phoneNumber },
      { $set: objectData }
    );
    return !!updatedResult.modifiedCount;
  }

  async completeProfile(req, res) {
    await completeProfileSchema.validateAsync(req.body);
    const { user } = req;
    const { name, email, role } = req.body;

    const duplicateUser = await UserModel.findOne({ email });
    if (duplicateUser)
      throw createError.BadRequest(
        "A user with this email has already registered."
      );

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          name,
          email,
          isActive: true,
          role,
          status: 2,
          isVerifiedPhoneNumber: true,
        },
      },
      { new: true }
    );
    // await setAuthCookie(res, updatedUser);
    await setAccessToken(res, updatedUser);
    await setRefreshToken(res, updatedUser);

    return res.status(HttpStatus.OK).send({
      statusCode: HttpStatus.OK,
      data: {
        message: "Your information has been successfully completed",
        user: updatedUser,
      },
    });
  }
  async updateProfile(req, res) {
    const { _id: userId } = req.user;
    await updateProfileSchema.validateAsync(req.body);
    const { name, email, biography, phoneNumber } = req.body;

    const updateResult = await UserModel.updateOne(
      { _id: userId },
      {
        $set: { name, email, biography, phoneNumber },
      }
    );
    if (!updateResult.modifiedCount === 0)
      throw createError.BadRequest("Information could not be edited");
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: "Information successfully updated",
      },
    });
  }
  async refreshToken(req, res) {
    const userId = await verifyRefreshToken(req);
    const user = await UserModel.findById(userId);
    await setAccessToken(res, user);
    await setRefreshToken(res, user);
    return res.status(HttpStatus.OK).json({
      StatusCode: HttpStatus.OK,
      data: {
        user,
      },
    });
  }
  async getUserProfile(req, res) {
    const { _id: userId } = req.user;
    const user = await UserModel.findById(userId, { otp: 0 });

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        user,
      },
    });
  }

  logout(req, res) {
    const cookieOptions = {
      maxAge: 1,
      expires: Date.now(),
      httpOnly: true,
      signed: true,
      sameSite: "None", // Updated to 'None'
      secure: process.env.NODE_ENV === "production", // Set secure to true in production
      path: "/",
    };
    res.cookie("accessToken", null, cookieOptions);
    res.cookie("refreshToken", null, cookieOptions);

    return res.status(HttpStatus.OK).json({
      StatusCode: HttpStatus.OK,
      roles: null,
      auth: false,
    });
  }
}

module.exports = {
  UserAuthController: new userAuthController(),
};
