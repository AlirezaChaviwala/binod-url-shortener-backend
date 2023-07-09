const mongoose = require("mongoose");
const {
  authenticationStringExpireAt,
  refreshTokenExpireAt,
} = require("./constants");
// const castAggregation = require('mongoose-cast-aggregation');

// mongoose.plugin(castAggregation);

const authenticationStringSchema = new mongoose.Schema({
  randomString: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  isValid: {
    type: Boolean,
    required: true,
    default: true,
  },
  expire_at: { type: Date, expires: authenticationStringExpireAt },
});

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  expire_at: { type: Date, expires: refreshTokenExpireAt },
});

const RefreshTokens = mongoose.model(
  "RefreshTokens",
  refreshTokenSchema,
  "RefreshTokens"
);
const AuthenticationStrings = mongoose.model(
  "AuthenticationStrings",
  authenticationStringSchema,
  "AuthenticationStrings"
);

module.exports = { RefreshTokens, AuthenticationStrings };
