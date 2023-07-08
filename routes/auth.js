const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
require("dotenv").config();
const createError = require("http-errors");
const { User, RT, RS } = require("../Models/User.model");
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

//Sign Up and user creation 
router.post("/signUp", async (req, res, next) => {
    try {
      const validCred = await signUpAuthSchema.validateAsync(req.body);
  
      let doesExist = await User.findOne({ email: validCred.email });
      if (doesExist)
        throw createError.Conflict(
          `Account with email:${validCred.email} has already been registered`
        );
  
      let user = new User(validCred);
      await user.save();
  
      res.status(200).send({ message: "User created successfully" });
    } catch (err) {
      if (err.isJoi === true) {
        err.status = 422;
      }
      next(err);
    }
  });
  
  //Sign In and Token Generation
  router.post("/signIn", async (req, res, next) => {
    try {
      const validCred = await signInAuthSchema.validateAsync(req.body);
      const user = await User.findOne({ email: validCred.email });
      if (!user)
        throw createError.NotFound(
          `${validCred.email} does not belong to a registered account`
        );
  
      const isMatch = await user.verifyPassword(validCred.password);
      if (!isMatch) throw createError.Unauthorized("Invalid Email Id/Password");
  
      const refreshTokenCount = await RT.find({ userId: ObjectId(user.userId) });
      if (refreshTokenCount.length > 3)
        await RT.deleteMany({ userId: ObjectId(user.userId) });
  
      let accessToken = await signAccesToken(user.id);
      let refreshToken = await signRefreshToken(user.id);
  
      res
        .cookie("token", refreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
  
        res.status(200);
        res.send({ accessToken });
    } catch (err) {
      if (err.isJoi === true)
        {return next(createError.BadRequest("Invalid Email Id/Password"));}
      next(err);
    }
  });
  
  //Forgot password and email verification
  router.post("/forgotMyPassword", async (req, res, next) => {
    try {
      const validCred = await forgotPasswordEmailAuthSchema.validateAsync({
        email: req.body.email,
      });
  
      const user = await User.findOne({ email: req.body.email });
      if (!user)
        throw createError.NotFound(
          `${validCred.email} does not belong to a registered account`
        );
  
      let randomString = randomStringGen.generate();
  
      let randomStringRecord = new RS({ randomString, email: user.email });
  
      await randomStringRecord.save();
  
      let resetPasswordURL = `http://localhost:3000/forgotMyPassword-auth?rs=${randomString}&e=${user.email}`;
  
      let result = await sendMail({
        receipentMailId: user.email,
        resetPasswordURL,
      });
      if (result.accepted && result.accepted.length > 0) {
        console.log("email sent");
        res.status(200).send({
          message: `An email with the password reset link has been sent to ${user.email}. Please check your inbox`,
        });
      } else {
        throw createError.InternalServerError();
      }
    } catch (err) {
      if (err.isJoi === true)
        return next(createError.BadRequest("Invalid Email Id"));
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
  
      const randomStringRecord = await RS.findOne({
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
  
      let validRandomStringRecord = await RS.findOne({
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
      await RT.deleteOne({ userId });
  
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
  
      await RT.deleteOne({ userId });
  
      res.clearCookie("token");
  
      res.status(204).send({ message: "You have been logged out successfully" });
    } catch (error) {
      next(error);
    }
  });