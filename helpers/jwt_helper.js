const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { RefreshTokens } = require('../models/auth');
const { refreshTokenMaxAge } = require('../services/constants');

module.exports = {
    signAccesToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {}
            const secretKey = process.env.ACCESS_TOKEN_KEY;
            const options = { expiresIn: '10min', issuer: 'bin.od', audience: userId }
            jwt.sign(payload, secretKey, options, (err, token) => {
                if (err) {
                    console.log(err.message);
                    return reject(createError.InternalServerError());
                }
                return resolve(token);
            });
        });
    },
    authenticateAccessToken: (req, res, next) => {
        if (!req.headers.authorization) return next(createError.Unauthorized())

        let header = req.headers.authorization.split(" ");
        let token = header[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, payload) => {
            if (err) {
                const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
                return next(createError.Unauthorized(message));
            }
            req.payload = payload;
            next();
        })
    },
    signRefreshToken: (userId) => {
        return new Promise(async(resolve, reject) => {
            const result = await RefreshTokens.findOne({ userId });
            if (result) await RefreshTokens.deleteOne({ userId });

            const payload = {}
            const secretKey = process.env.REFRESH_TOKEN_KEY;
            const options = { expiresIn: '30d', issuer: 'bin.od', audience: userId }
            jwt.sign(payload, secretKey, options, async(err, token) => {
                if (err) {
                    console.log(err.message);
                    return reject(createError.InternalServerError());
                }


                const refToken = new RefreshTokens({ userId, token,expire_at:new Date(Date.now()+refreshTokenMaxAge) });
                await refToken.save();
                return resolve(token);
            });
        });
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, async(err, payload) => {
                const result = await RefreshTokens.findOne({ "token": refreshToken });
                if (err && !result) return reject(createError.Unauthorized());
                const userId = payload.aud;

                resolve(userId);
            })
        })
    }
}