import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

/**
 * Configure Passport.js Google OAuth 2.0 Strategy
 * Handles user authentication via Google
 */
const configurePassport = () => {
  // Only configure Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Extract user information from Google profile
            const email = profile.emails[0].value;
            const googleId = profile.id;
            const name = profile.displayName;
            const avatar = profile.photos[0]?.value;

            // Check if user exists by googleId or email
            let user = await User.findOne({
              $or: [{ googleId }, { email: email.toLowerCase() }],
            });

            if (user) {
              // User exists - update Google ID if not set
              if (!user.googleId) {
                user.googleId = googleId;
                user.isVerified = true; // Google accounts are verified
                await user.save();
              }

              // Update last login
              user.lastLogin = new Date();
              await user.save();

              return done(null, user);
            }

            // User doesn't exist - create new account
            user = new User({
              email: email.toLowerCase(),
              googleId,
              name,
              avatar,
              isVerified: true, // Google accounts are pre-verified
              roles: ['user'],
            });

            await user.save();
            return done(null, user);
          } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
          }
        }
      )
    );
  } else {
    console.warn('⚠️  Google OAuth credentials not provided. Google login will be disabled.');
  }

  // Serialize user for session (not used with JWT, but required by Passport)
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
