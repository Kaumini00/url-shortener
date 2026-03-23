const { OAuth2Client } = require('google-auth-library');
const { hashPassword, verifyPassword, generateJwt } = require('../services/authService');
const { createUser, findByEmail, findByGoogleId, createGoogleUser, linkGoogleId } = require('../models/userModel');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'This account uses Google Sign-In' });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateJwt({ id: user.id, email: user.email });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: 'Google Sign-In is not configured' });
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, email_verified } = payload;

    if (!email_verified) {
      return res.status(403).json({ error: 'Google email is not verified' });
    }

    // Find or create user
    let user = await findByGoogleId(googleId);

    if (!user) {
      const existing = await findByEmail(email);
      if (existing) {
        // Link Google ID to an existing email/password account
        user = await linkGoogleId(existing.id, googleId);
      } else {
        // New user — create without a password
        user = await createGoogleUser(email, googleId);
      }
    }

    const token = generateJwt({ id: user.id, email: user.email });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, googleAuth };
