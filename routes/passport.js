const { ExtractJwt, Strategy } = require("passport-jwt");
const passport = require("passport");
const User = require("../models/User");
const Config = require('../config');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: Config.secret,
};

passport.use(
    new Strategy(opts, async (payload, done) => {
        try {
            const user =  User.where({ email: payload.email }).fetch({ require: false });
            if (user) return done(null, user);
        } catch (error) {
            return done(error);
        }
    })
);

module.exports = passport;