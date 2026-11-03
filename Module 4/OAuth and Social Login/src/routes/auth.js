'use strict';

// routes/auth.js — OAuth entry points

const router = require('express').Router();

const { passport } = require('../auth/passport');

const { signToken } = require('../utils/jwt');

// ── Route 1 — triggers the OAuth flow ──────────────────────────────────────

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['openid', 'email', 'profile'],
    session: false,
  }),
);

// ── Route 2 — Google OAuth callback ────────────────────────────────────────

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/failure',
  }),
  (req, res) => {

    // Issue app JWT using the authenticated user's ID and role
    const token = signToken({
      sub: req.user.id,
      role: req.user.role
    });

    // Return token as JSON
    res.json({ token });
  },
);

// ── Given: shown when OAuth fails ──────────────────────────────────────────

router.get('/failure', (_req, res) => {
  res.status(401).json({
    error: {
      code: 'OAUTH_FAILED',
      message: 'Google login failed or was denied'
    }
  });
});

module.exports = router;
