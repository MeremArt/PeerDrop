import { Request, Response } from "express";
import twitterService from "../services/twitter.service";
import { validationResult } from "express-validator";

export const checkTweetEngagement = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tweetId } = req.params;
    const thresholdFollowers = req.query.threshold
      ? parseInt(req.query.threshold as string)
      : 10000;

    const result = await twitterService.checkTweetEngagement(
      tweetId,
      thresholdFollowers
    );
    return res.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      message: "Error checking tweet engagement",
      error: errorMessage,
    });
  }
};

export const checkUserEngagement = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.params;
    const thresholdFollowers = req.query.threshold
      ? parseInt(req.query.threshold as string)
      : 10000;

    const result = await twitterService.checkUserEngagement(
      username,
      thresholdFollowers
    );
    return res.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      message: "Error checking user engagement",
      error: errorMessage,
    });
  }
};
