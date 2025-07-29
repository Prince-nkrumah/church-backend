const jwt = require('jsonwebtoken');
const { User } = require('../models');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h',
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // 🔐 Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Create token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Optional debug logs
    console.log('Input password:', password);
    console.log('Stored hash:', user.password);
    console.log('Password match:', isMatch);
    console.log('User:', user); // ✅ just reuse the variable

    const token = generateToken(user.id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};



exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.setup2FA = async (req, res) => {
  const { userId } = req.user;
  const secret = speakeasy.generateSecret({
    issuer: process.env.TOTP_ISSUER,
    name: `${req.user.email}`,
    length: 20
  });

  // Save to DB
  await User2FA.upsert({
    userId,
    secret: secret.base32,
    backupCodes: Array(5).fill().map(() => Math.random().toString(36).slice(2, 10)),
    isEnabled: false
  });

  // Generate QR Code
  QRCode.toDataURL(secret.otpauth_url, (err, qrCode) => {
    if (err) return res.status(500).json({ error: 'Failed to generate QR' });
    res.json({ secret: secret.base32, qrCode, backupCodes });
  });
};

// Verify 2FA activation
exports.verify2FA = async (req, res) => {
  const { token } = req.body;
  const { userId } = req.user;

  const user2FA = await User2FA.findOne({ where: { userId } });
  const verified = speakeasy.totp.verify({
    secret: user2FA.secret,
    encoding: 'base32',
    token
  });

  if (verified) {
    await user2FA.update({ isEnabled: true });
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Middleware to enforce 2FA
exports.require2FA = async (req, res, next) => {
  const user2FA = await User2FA.findOne({ where: { userId: req.user.id } });
  if (user2FA?.isEnabled) {
    const { totpToken } = req.headers;
    if (!totpToken) return res.status(403).json({ error: '2FA token required' });

    const verified = speakeasy.totp.verify({
      secret: user2FA.secret,
      encoding: 'base32',
      token: totpToken,
      window: 1
    });

    if (!verified) return res.status(403).json({ error: 'Invalid 2FA token' });
  }
  next();
};