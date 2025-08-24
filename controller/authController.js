const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// For a minimal initial implementation we'll support an env-defined admin user.
// In future this should validate against a users table in the database.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null; // optional hashed password
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD || 'Moryacars@2222';

// Helper to compare password with optional hash
const comparePassword = async (plain) => {
  if (ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(plain, ADMIN_PASSWORD_HASH);
  }
  // fallback to plain comparison (not recommended in production)
  return plain === ADMIN_PASSWORD_PLAIN;
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Minimal auth: only a single admin user configured via env
    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Sign JWT
    const payload = { email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });

    res.json({ success: true, token, user: { email } });
  } catch (err) {
    console.error('Auth error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
