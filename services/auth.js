const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
require("dotenv").config();
const createError = require("http-errors");
const { User } = require("../models/users");
const { RefreshTokens, AuthenticationStrings } = require("../models/auth");
const {
  signUpAuthSchema,
  signInAuthSchema,
  randomStringGenAuthSchema,
  forgotPasswordEmailAuthSchema,
  newPasswordAuthSchema,
} = require("../helpers/validation_schema");
const {
  signAccesToken,
  authenticateAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");

const { sendMail } = require("../helpers/mailer");
const randomStringGen = require("randomstring");
const {
  responseCodes,
  responseStatuses,
  refreshTokenMaxAge,
  authenticationStringMaxAge,
} = require("./constants");
const config = require("../config/config.json");

const signUp = async (req) => {
  const output = {
    message: responseStatuses.INTERNAL_SERVER_ERROR,
    success: false,
    status: responseCodes.INTERNAL_SERVER_ERROR,
  };
  try {
    const validCred = await signUpAuthSchema.validateAsync(req.body);

    let doesExist = await User.findOne({ email: validCred.email });
    if (doesExist) {
      output.message = `Account with email: ${validCred.email} has already been registered`;
      output.status = responseCodes.CONFLICT;
      //   throw createError.Conflict(
      //     `Account with email:${validCred.email} has already been registered`
      //   );
    } else {
      let user = new User(validCred);
      await user.save();
      output.success = true;
      output.status = responseCodes.SUCCESS;
      output.message = "User created successfully";
    }
  } catch (error) {
    if (error.isJoi) {
      output.status = responseCodes.VALIDATION_ERROR;
      output.message = error.message;
    }
  }

  return output;
};

const signIn = async (req) => {
  const output = {
    data: null,
    message: responseStatuses.INTERNAL_SERVER_ERROR,
    success: false,
    status: responseCodes.INTERNAL_SERVER_ERROR,
  };
  try {
    const validCred = await signInAuthSchema.validateAsync(req.body);
    const user = await User.findOne({ email: validCred.email });
    if (!user) {
      output.message = `${validCred.email} does not belong to a registered account`;
      output.status = responseCodes.NOT_FOUND;
      // throw createError.NotFound(
      //   `${validCred.email} does not belong to a registered account`
      // );
    } else {
      const isMatch = await user.verifyPassword(validCred.password);

      if (!isMatch) {
        output.message = "Invalid Email Id/Password";
        output.status = responseCodes.UNAUTHORIZED;
        // throw createError.Unauthorized("Invalid Email Id/Password");
      } else {
        const refreshTokenCount = await RefreshTokens.find({
          userId: ObjectId(user.userId),
        });
        if (refreshTokenCount.length > 3)
          await RefreshTokens.deleteMany({ userId: ObjectId(user.userId) });

        let accessToken = await signAccesToken(user.id);
        let refreshToken = await signRefreshToken(user.id);

        output.success = true;
        output.message = "Signed In successfully";
        output.status = responseCodes.SUCCESS;
        output.data = {
          refreshToken,
          accessToken,
          cookie: {
            name: "token",
            config: {
              httpOnly: true,
              maxAge: refreshTokenMaxAge,
            },
          },
        };
      }
    }
  } catch (error) {
    if (error.isJoi) {
      output.status = responseCodes.VALIDATION_ERROR;
      output.message = error.message;
    }
  }

  return output;
};

const forgotMyPassword = async (req) => {
  const output = {
    message: responseStatuses.INTERNAL_SERVER_ERROR,
    success: false,
    status: responseCodes.INTERNAL_SERVER_ERROR,
  };
  try {
    const validCred = await forgotPasswordEmailAuthSchema.validateAsync({
      email: req.body.email,
    });
    console.log("here");
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      output.message = `${validCred.email} does not belong to a registered account`;
      output.status = responseCodes.NOT_FOUND;
      // throw createError.NotFound(
      //   `${validCred.email} does not belong to a registered account`
      // );
    } else {
      let randomString = randomStringGen.generate();

      let randomStringRecord = new AuthenticationStrings({
        randomString,
        email: user.email,
        expire_at: authenticationStringMaxAge,
      });

      await randomStringRecord.save();
      const clientUrl = config.clientUrl;

      let resetPasswordURL = `${clientUrl}/forgotMyPassword-auth?rs=${randomString}&e=${user.email}`;

      console.log(resetPasswordURL);

      let result = await sendMail({
        receipentMailId: user.email,
        resetPasswordURL,
      });
      console.log(result);
      if (result && result.accepted && result.accepted.length > 0) {
        output.success = true;
        output.message = `An email with the password reset link has been sent to ${user.email}. Please check your inbox`;
        output.status = responseCodes.SUCCESS;
      }
    }
  } catch (error) {
    if (error.isJoi) {
      output.status = responseCodes.VALIDATION_ERROR;
      output.message = error.message;
    }
  }

  return output;
};

module.exports = {
  signUp,
  signIn,
  forgotMyPassword,
};
