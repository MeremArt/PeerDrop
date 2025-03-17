"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserEngagement = exports.checkTweetEngagement = void 0;
const twitter_service_1 = __importDefault(require("../services/twitter.service"));
const express_validator_1 = require("express-validator");
const checkTweetEngagement = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { tweetId } = req.params;
        const thresholdFollowers = req.query.threshold
            ? parseInt(req.query.threshold)
            : 10000;
        const result = await twitter_service_1.default.checkTweetEngagement(tweetId, thresholdFollowers);
        return res.json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({
            message: "Error checking tweet engagement",
            error: errorMessage,
        });
    }
};
exports.checkTweetEngagement = checkTweetEngagement;
const checkUserEngagement = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username } = req.params;
        const thresholdFollowers = req.query.threshold
            ? parseInt(req.query.threshold)
            : 10000;
        const result = await twitter_service_1.default.checkUserEngagement(username, thresholdFollowers);
        return res.json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({
            message: "Error checking user engagement",
            error: errorMessage,
        });
    }
};
exports.checkUserEngagement = checkUserEngagement;
