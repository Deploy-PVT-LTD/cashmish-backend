import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import keys from './keys.js';
import { User } from '../models/userModel.js';

export default (passport) => {
  // JWT Strategy
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: keys.jwtSecret
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      console.log("JWT Strategy Triggered");
      console.log("Payload:", jwt_payload);
      try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
          console.log("User found:", user.email);
          return done(null, user);
        }
        console.log("User not found via ID:", jwt_payload.id);
        return done(null, false);
      } catch (err) {
        console.error("JWT Strategy Error:", err);
        return done(err, false);
      }
    })
  );

  // Google Strategy
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