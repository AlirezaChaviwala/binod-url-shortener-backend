const Joi = require('joi');

const signUpAuthSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).required()
})

const signInAuthSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).required()
})

const binodLinkAuthSchema = Joi.object({
    longUrl: Joi.string().required()
})

module.exports = {
    signUpAuthSchema,
    signInAuthSchema,
    binodLinkAuthSchema
}