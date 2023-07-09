const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
require("dotenv").config();
const urlExist = require("url-exists");
const createError = require("http-errors");
const shortid = require("shortid");
const { User } = require("../models/users");
const {
  signUpAuthSchema,
  signInAuthSchema,
  binodLinkAuthSchema,
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

// GET users listing.
router.get("/", function (req, res, next) {
  res.send("Welcome to binod URL shortener");
});



//Load the Dashboard
router.post("/dashboard", authenticateAccessToken, async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: ObjectId(req.payload.aud) });
    const userName = userData.name;
    const data = await BIN.aggregate([{"$match":{"userId": ObjectId(req.payload.aud)}},{"$project":{"_id":false,"userId":false,"__v":false}}]);
    res.status(200).send({ data, userName });
  } catch (err) {
    next(err);
  }
});

//Generate short Url and push record in DB
router.post("/binodit", authenticateAccessToken, async (req, res, next) => {
  try {
    const inpData = await binodLinkAuthSchema.validateAsync(req.body);

    const isDuplicate = await BIN.findOne({
      userId: req.payload.aud,
      longUrl: inpData.longUrl,
    });
    if (isDuplicate)
      throw createError.Conflict(
        `Short Link for ${inpData.longUrl} already created`
      );

    urlExist(inpData.longUrl, async (err, exists) => {
      if (err) throw createError.InternalServerError();
      if (!exists)
        throw createError.BadRequest(
          `The URL: ${inpData.longUrl} does not exist`
        );
      else {
        const binLink = new BIN({
          userId: ObjectId(req.payload.aud),
          longUrl: inpData.longUrl,
          shortUrl: shortid.generate(),
          count: 0,
        });
        await binLink.save();
      }
    });

    res.sendStatus(200);
  } catch (err) {
    if (err.isJoi === true)
      {return next(createError.BadRequest("Invalid URL"));}
    next(err);
  }
});

//Redirect to Long Url through Short URL
router.get("/url/:short", async (req, res, next) => {
  try {
    const binLink = await BIN.findOne({ shortUrl: req.params.short });
    if (!binLink) {
      res.redirect(`/frontEnd/invalidShortUrl?url=${req.params.short}`);
    } else {
      await BIN.updateOne(
        { shortUrl: req.params.short },
        { $inc: { count: 1 } }
      );
      res.redirect(binLink.longUrl);
    }
  } catch (err) {
    next(createError.InternalServerError());
  }
});

//Get records of a particular user
router.post("/getRecords", authenticateAccessToken, async (req, res, next) => {
  try {
    const data = await BIN.aggregate([{"$match":{"userId": ObjectId(req.payload.aud)}},{"$project":{"_id":false,"userId":false,"__v":false}}]);
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
