import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import keys from './keys.js';
import { User } from '../models/userModel.js';

export default (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: keys.googleClientId,
        clientSecret: keys.googleClientSecret,
        callbackURL: keys.googleCallbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          let user = await User.findOne({ email });

          if (user) return done(null, user);

          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            password: null
          });

          done(null, user);
        } catch (err) {
          console.error(err);
          done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
  });
};