import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Profile } from "passport-twitter";

export const configurePassport = () => {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY as string,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET as string,
        callbackURL: "oob",
      },
      (token: string, tokenSecret: string, profile: Profile, done: any) => {
        const userProfile = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          photos: profile.photos
            ? profile.photos.map((photo: { value: string }) => photo.value)
            : [],
        };
        return done(null, userProfile);
      }
    )
  );

  passport.serializeUser((user: any, done: any) => {
    done(null, user);
  });

  passport.deserializeUser((obj: any, done: any) => {
    done(null, obj);
  });
};
