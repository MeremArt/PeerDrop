"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_twitter_1 = require("passport-twitter");
const configurePassport = () => {
    passport_1.default.use(new passport_twitter_1.Strategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: "oob",
    }, (token, tokenSecret, profile, done) => {
        const userProfile = {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            photos: profile.photos
                ? profile.photos.map((photo) => photo.value)
                : [],
        };
        return done(null, userProfile);
    }));
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((obj, done) => {
        done(null, obj);
    });
};
exports.configurePassport = configurePassport;
