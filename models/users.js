const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// const castAggregation = require('mongoose-cast-aggregation');

// mongoose.plugin(castAggregation); 

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

const User = mongoose.model('Users', UserSchema,'Users');

module.exports = { User};