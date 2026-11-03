'use strict';
// auth/passport.js — Google OAuth strategy
//
// YOUR TASK: implement verifyCallback below.
//
// Passport has already handled the full OAuth dance (redirect → code → token
// exchange → userinfo fetch) by the time verifyCallback is called.
// You receive the Google profile and must decide what user object to return.
//
// profile.id               → Google's stable permanent ID for this user (store as googleId)
// profile.emails[0].value  → the user's email address (may change; don't use as primary key)
// profile.displayName      → their full name
// profile._json.email_verified → boolean; only link to an existing account when true
//
// done(null, user)   → success; Passport sets req.user = user
// done(null, false)  → auth rejected (e.g. email not verified); Passport returns 401
// done(err)          → unexpected error; Passport returns 500

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { users, nextId } = require('../data');

// ─── IMPLEMENTATION ────────────────────────────────────────────────────────────

async function verifyCallback(accessToken, refreshToken, profile, done) {

  const email = profile.emails[0].value;

  // 1. RETURNING OAuth user
  const existingGoogleUser = users.find(
    user => user.googleId === profile.id
  );

  if (existingGoogleUser) {
    return done(null, existingGoogleUser);
  }

  // 2. EXISTING local account (first-time Google login)
  const existingUser = users.find(
    user => user.email === email
  );

  if (existingUser) {

    if (profile._json.email_verified === true) {
      existingUser.googleId = profile.id;
      return done(null, existingUser);
    }

    return done(null, false);
  }

  // 3. BRAND-NEW user
  const newUser = {
    id: nextId(),
    googleId: profile.id,
    email: email,
    name: profile.displayName,
    role: 'member'
  };

  users.push(newUser);

  return done(null, newUser);
}

// ─── PASSPORT GOOGLE STRATEGY ──────────────────────────────────────────────────

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
      callbackURL: '/auth/google/callback',
    },
    verifyCallback,
  ),
);

// verifyCallback is exported so tests can call it directly without a real browser.
module.exports = { passport, verifyCallback };

