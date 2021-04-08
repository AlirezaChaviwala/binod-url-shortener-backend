const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    }
})

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
})

const binodLinkSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    longUrl: {
        type: String,
        required: true
    },
    shortUrl: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    }
})

UserSchema.pre('save', async function(next) {
    try {
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(this.password, salt);
        this.password = hash;
        next();
    } catch (err) {
        next(err);
    }
})

UserSchema.methods.verifyPassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (err) {
        throw err
    }
}


const User = mongoose.model('user', UserSchema);
const RT = mongoose.model('refreshtoken', refreshTokenSchema);
const BIN = mongoose.model('binodrecord', binodLinkSchema);

module.exports = { User, RT, BIN };