const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { RT } = require('../Models/User.model');

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

        const token = req.headers.authorization;
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
            const result = await RT.findOne({ userId });
            if (result) await RT.deleteOne({ userId });

            const payload = {}
            const secretKey = process.env.REFRESH_TOKEN_KEY;
            const options = { expiresIn: '30d', issuer: 'bin.od', audience: userId }
            jwt.sign(payload, secretKey, options, async(err, token) => {
                if (err) {
                    console.log(err.message);
                    return reject(createError.InternalServerError());
                }
                const refToken = new RT({ userId, token });
                await refToken.save();
                return resolve(token);
            });
        });
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, async(err, payload) => {
                const result = await RT.findOne({ token: refreshToken });
                if (err && !result) return reject(createError.Unauthorized());
                const userId = payload.aud;

                resolve(userId);
            })
        })
    }
}