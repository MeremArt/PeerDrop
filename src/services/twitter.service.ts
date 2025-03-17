import { TwitterApi } from "twitter-api-v2";

class TwitterService {
  private client: TwitterApi;

  constructor() {
    // Initialize Twitter client with bearer token from env variables
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      console.warn(
        "Twitter bearer token not provided. Twitter API functionality will be limited."
      );
    }
    this.client = new TwitterApi(bearerToken || "");
  }

  /**
   * Check if a tweet's author has high engagement based on follower count
   * @param tweetId - The ID of the tweet to check
   * @param thresholdFollowers - Minimum followers to consider "high engagement"
   * @returns Object with engagement metrics and status
   */
  async checkTweetEngagement(
    tweetId: string,
    thresholdFollowers: number = 10000
  ) {
    try {
      // Fetch the tweet with expanded author information
      const tweet = await this.client.v2.singleTweet(tweetId, {
        expansions: "author_id",
        "user.fields": "public_metrics,username,name,profile_image_url",
        "tweet.fields": "public_metrics,created_at",
      });

      if (!tweet || !tweet.data || !tweet.includes || !tweet.includes.users) {
        throw new Error("Invalid or protected tweet");
      }

      // Get the tweet's author from the included users array
      const author = tweet.includes.users[0];
      if (!author.public_metrics) {
        throw new Error("Author public metrics are undefined");
      }
      const followerCount = author.public_metrics.followers_count;
      const followingCount = author.public_metrics.following_count;
      const tweetCount = author.public_metrics.tweet_count;

      // Get tweet engagement metrics
      const likeCount = tweet.data.public_metrics?.like_count || 0;
      const retweetCount = tweet.data.public_metrics?.retweet_count || 0;
      const replyCount = tweet.data.public_metrics?.reply_count || 0;

      // Calculate engagement rate (likes + retweets + replies per follower)
      const engagementRate =
        followerCount && followerCount > 0
          ? ((likeCount + retweetCount + replyCount) / followerCount) * 100
          : 0;

      return {
        isHighEngagement: (followerCount ?? 0) >= thresholdFollowers,
        authorMetrics: {
          id: author.id,
          username: author.username,
          name: author.name,
          profileImageUrl: author.profile_image_url,
          followerCount,
          followingCount,
          tweetCount,
          followerRatio:
            (followingCount ?? 0) > 0
              ? ((followerCount ?? 0) / (followingCount ?? 1)).toFixed(2)
              : 0,
        },
        tweetMetrics: {
          id: tweet.data.id,
          text: tweet.data.text,
          createdAt: tweet.data.created_at,
          likeCount,
          retweetCount,
          replyCount,
          engagementRate: engagementRate.toFixed(2) + "%",
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error checking tweet engagement: ${errorMessage}`);
    }
  }

  /**
   * Check if a Twitter user has high engagement
   * @param username - Twitter username to check
   * @param thresholdFollowers - Minimum followers to consider "high engagement"
   */
  async checkUserEngagement(
    username: string,
    thresholdFollowers: number = 10000
  ) {
    try {
      const user = await this.client.v2.userByUsername(username, {
        "user.fields":
          "public_metrics,description,profile_image_url,verified,created_at",
      });

      if (!user || !user.data) {
        throw new Error("User not found or protected");
      }

      if (!user.data.public_metrics) {
        throw new Error("User public metrics are undefined");
      }
      const followerCount = user.data.public_metrics.followers_count;
      const followingCount = user.data.public_metrics.following_count;
      const tweetCount = user.data.public_metrics.tweet_count;

      return {
        isHighEngagement: (followerCount ?? 0) >= thresholdFollowers,
        userMetrics: {
          id: user.data.id,
          username: user.data.username,
          name: user.data.name,
          verified: user.data.verified,
          description: user.data.description,
          profileImageUrl: user.data.profile_image_url,
          createdAt: user.data.created_at,
          followerCount,
          followingCount,
          tweetCount,
          followerRatio:
            (followingCount ?? 0) > 0
              ? ((followerCount ?? 0) / (followingCount ?? 1)).toFixed(2)
              : 0,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error checking user engagement: ${errorMessage}`);
    }
  }
}

export default new TwitterService();
