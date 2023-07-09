const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
require("dotenv").config();
const createError = require("http-errors");
const { User } = require("../models/users");
const { RefreshTokens, AuthenticationStrings } = require("../models/auth");
const _ = require("lodash");
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

// const { sendMail } = require("../helpers/mailer");
const randomStringGen = require("randomstring");
const { signUp, signIn, forgotMyPassword } = require("../services/auth");
const { authenticationStringMaxAge } = require("../services/constants");

//Sign Up and user creation
router.post("/signUp", async (req, res, next) => {
  try {
    const response = await signUp(req);
    if (!response.success) {
      const error = {
        message: response.message,
        status: response.status,
      };
      throw error;
    }

    res.status(response.status).send(_.pick(response, ["success", "message"]));
  } catch (err) {
    next(err);
  }
});

//Sign In and Token Generation
router.post("/signIn", async (req, res, next) => {
  try {
    const response = await signIn(req);
    if (!response.success) {
      const error = {
        message: response.message,
        status: response.status,
      };
      throw error;
    }

    const { refreshToken, cookie } = response.data;

    res.cookie(cookie.name, refreshToken, cookie.config);
    res
      .status(response.status)
      .send(_.pick(response, ["success", "message", "data.accessToken"]));
  } catch (err) {
    // if (err.isJoi === true)
    //   {return next(createError.BadRequest("Invalid Email Id/Password"));}
    next(err);
  }
});

//Forgot password and email verification
router.post("/forgotMyPassword", async (req, res, next) => {
  try {
    const response = await forgotMyPassword(req);
    if (!response.success) {
      const error = {
        message: response.message,
        status: response.status,
      };
      throw error;
    }

    res.status(response.status).send(_.pick(response, ["success", "message"]));
  } catch (err) {
    next(err);
  }
});

//Verify e-mail and reset password
router.post("/forgotMyPassword-auth", async (req, res, next) => {
  try {
    const validCred = await randomStringGenAuthSchema.validateAsync({
      randomString: req.query.rs,
      email: req.query.e,
    });

    const randomStringRecord = await AuthenticationStrings.findOne({
      randomString: validCred.randomString,
      email: validCred.email,
    });
    if (!randomStringRecord) {
      let errorResponse = createError.NotFound(
        "Sorry, this link does not exist"
      );
      //res.redirect(`/errorPage?status=${errorResponse.status}`);
      res.send({
        message: `frontEnd/errorPage?status=${errorResponse.status}`,
      });
    }

    if (!randomStringRecord.isValid) {
      let errorResponse = createError.BadRequest(
        "Sorry, this link has already been used"
      );
      //res.redirect(`/errorPage?status=${errorResponse.status}`);
      res.send({
        message: `frontEnd/errorPage?status=${errorResponse.status}`,
      });
    }
    //res.redirect(`/resetPassword?s=200&e=${randomStringRecord.email}&rs=${randomStringRecord.randomString}`);
    res.send({
      message: `frontEnd/resetPassword?s=200&e=${randomStringRecord.email}&rs=${randomStringRecord.randomString}`,
    });
  } catch (err) {
    if (err.isJoi === true) return next(createError.BadRequest("Invalid URL"));
    next(err);
  }
});

//Submit new password
router.post("/createNewPassword", async (req, res, next) => {
  try {
    let validEmailAndString = await randomStringGenAuthSchema.validateAsync({
      randomString: req.body.randomString,
      email: req.body.email,
    });
    let validPassword = await newPasswordAuthSchema.validateAsync({
      password: req.body.newPassword,
    });

    let validRandomStringRecord = await AuthenticationStrings.findOne({
      email: validEmailAndString.email,
      randomString: validEmailAndString.randomString,
    });
    if (!validRandomStringRecord) {
      throw createError.RequestTimeout("Sorry, this session has expired");
    }

    if (!validRandomStringRecord.isValid) {
      throw createError.BadRequest("Sorry, this link has already been used");
      // //res.redirect(`/errorPage?status=${errorResponse.status}`);
      // res.send({message:`frontEnd/errorPage?status=${errorResponse.status}`});
    }

    let userRecord = await User.findOne({ email: validEmailAndString.email });
    userRecord.password = validPassword.password;
    await userRecord.save();
    validRandomStringRecord.isValid = false;
    await validRandomStringRecord.save();

    res.status(200).send({ message: "Your password was changed successfully" });
  } catch (err) {
    if (err.isJoi === true)
      return next(createError.BadRequest("Invalid Credentials"));
    next(err);
  }
});

//Token Regeneration
router.post("/getNewTokens", async (req, res, next) => {
  try {
    console.log(req.cookies);
    const refreshToken = req.cookies.token;

    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    await RefreshTokens.deleteOne({ userId });

    const accessToken = await signAccesToken(userId);
    const newRefreshToken = await signRefreshToken(userId);

    res
      .cookie("token", newRefreshToken, {
        httpOnly: true,
        maxAge: 1000 * 30 * 24 * 60 * 60,
      })
      .status(200)
      .send({ accessToken });
  } catch (err) {
    next(err);
  }
});

//Logout and Token Deletion
router.delete("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies.token;
    const userId = await verifyRefreshToken(refreshToken);
    //if (!userId) throw createError.BadRequest();

    await RefreshTokens.deleteOne({ userId });

    res.clearCookie("token");

    res.status(204).send({ message: "You have been logged out successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
