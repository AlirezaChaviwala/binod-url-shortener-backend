const express = require("express");
const router = express.Router();
const MongoClient = require("mongodb").MongoClient;
const { ObjectId } = require('mongodb')
require('dotenv').config();
const uri = process.env.DB_URL || "mongodb://127.0.0.1:27017";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const urlExist = require('url-exists');
const createError = require('http-errors');
const shortid = require('shortid');
const { User, RT, BIN } = require('../Models/User.model');
const { signUpAuthSchema, signInAuthSchema, binodLinkAuthSchema } = require('../helpers/validation_schema');
const { signAccesToken, authenticateAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwt_helper');

/* GET users listing. 
router.get("/", function(req, res, next) {
    res.send("respond with a resource");
})*/


//Sign Up and Token generation
router.post('/signUp', async(req, res, next) => {
    try {
        const validCred = await signUpAuthSchema.validateAsync(req.body);

        let doesExist = await User.findOne({ "email": validCred.email });
        if (doesExist) throw createError.Conflict(`Account with email:${validCred.email} has already been registered`);

        let user = new User(validCred);
        await user.save();

        res.status(200).send({ message: 'User created successfully' });
    } catch (err) {
        if (err.isJoi === true) { err.status = 422 }
        next(err);
    }
});

//Sign In and Token Generation
router.post("/signIn", async(req, res, next) => {
    try {

        const validCred = await signInAuthSchema.validateAsync(req.body);
        const user = await User.findOne({ email: validCred.email });
        if (!user) throw createError.NotFound(`${validCred.email} does not belong to a registered account`);

        const isMatch = await user.verifyPassword(validCred.password);
        if (!isMatch) throw createError.Unauthorized('Invalid Email Id/Password');

        let accessToken = await signAccesToken(user.id);
        let refreshToken = await signRefreshToken(user.id);

        res.cookie('token', refreshToken, { httpOnly: true, maxAge: 1000 * 30 * 24 * 60 * 60 }).status(200).send({ accessToken });

    } catch (err) {
        if (err.isJoi === true) return next(createError.BadRequest('Invalid Email Id/Password'))
        next(err);
    }
});

//Token Regeneration
router.post("/grt", async(req, res, next) => {
    try {
        const refreshToken = req.cookies.token;

        if (!refreshToken) throw createError.BadRequest();
        const userId = await verifyRefreshToken(refreshToken);

        const accessToken = await signAccesToken(userId);
        const newRefreshToken = await signRefreshToken(userId);

        res.cookie('token', newRefreshToken, { httpOnly: true, maxAge: 1000 * 30 * 24 * 60 * 60 }).status(200).send({ accessToken });

    } catch (err) {
        next(err);
    }
});

//Logout and Token Deletion
router.delete('/logout', async(req, res, next) => {
    try {
        const refreshToken = req.cookies.token;
        const userId = await verifyRefreshToken(refreshToken);
        if (!userId) throw createError.BadRequest();

        await RT.deleteOne({ userId });

        res.clearCookie('token');

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }

});


//Load the Dashboard
router.post("/dashboard", authenticateAccessToken, async(req, res, next) => {
    try {
        const userData = await User.findOne({ "_id": ObjectId(req.payload.aud) });
        const userName = userData.name;
        const data = await BIN.find({ "userId": ObjectId(req.payload.aud) });
        res.status(200).send({ data, userName });
    } catch (err) {
        next(err);
    }
});

//Generate short Url and push record in DB 
router.post("/binodit", authenticateAccessToken, async(req, res, next) => {
    try {
        const inpData = await binodLinkAuthSchema.validateAsync(req.body);

        const isDuplicate = await BIN.findOne({ "longUrl": inpData.longUrl });
        if (isDuplicate) throw createError.Conflict(`Short Link for ${inpData.longUrl} already created`);

        urlExist(inpData.longUrl, async(err, exists) => {
            if (err) throw createError.InternalServerError();
            if (!exists) throw createError.BadRequest(`The URL: ${inpData.longUrl} does not exist`);
            else {
                const binLink = new BIN({ userId: ObjectId(req.payload.aud), longUrl: inpData.longUrl, shortUrl: shortid.generate(), count: 0 });
                await binLink.save();
            }
        });

        res.sendStatus(200);

    } catch (err) {
        next(err);
    }
});

//Redirect to Long Url through Short URL
router.get('/:short', async(req, res, next) => {
    try {
        const binLink = await BIN.findOne({ "shortUrl": req.params.short });
        if (!binLink) throw createError.NotFound(`Invalid short URL`);
        await BIN.updateOne({ "shortUrl": req.params.short }, { $inc: { "count": 1 } });

        res.redirect(binLink.longUrl);
    } catch (err) {
        next(err);
    }
});

//Get records of a particular user
router.post('/getRecords', authenticateAccessToken, async(req, res, next) => {
    try {
        const data = await BIN.find({ "userId": ObjectId(req.payload.aud) });
        res.status(200).send(data);
    } catch (err) {
        next(err);
    }
});


module.exports = router