const mongoose = require('mongoose');
const castAggregation = require('mongoose-cast-aggregation');

mongoose.plugin(castAggregation); 

const randomStringSchema=new mongoose.Schema({
    randomString:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    isValid:{
        type:Boolean,
        required:true,
        default:true
    },
    expire_at: { type: Date, default: Date.now, expires: 60 * 10 }
});

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expire_at: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }
});

const RT = mongoose.model('refreshtokens', refreshTokenSchema);
const RS=mongoose.model('fmp-randomStrings',randomStringSchema);

module.exports = {  RT,RS};