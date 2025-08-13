const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { User2FA } = require('../models');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

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
    console.log("Login Attempt:", email);

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

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
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
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
  const userId = req.user.id;

  const secret = speakeasy.generateSecret({
    issuer: process.env.TOTP_ISSUER,
    name: `${req.user.email}`,
    length: 20
  });

  const backupCodes = Array(5).fill().map(() => Math.random().toString(36).slice(2, 10));

  // Save to DB
  await User2FA.upsert({
    userId,
    secret: secret.base32,
    backupCodes,
    isEnabled: false
  });

  // Generate QR Code
  QRCode.toDataURL(secret.otpauth_url, (err, qrCode) => {
  if (err) {
    console.error("QR generation error:", err);
    return res.status(500).json({ error: 'Failed to generate QR' });
  }
  res.json({ secret: secret.base32, qrCode, backupCodes });
});
};

// Verify 2FA activation
exports.verify2FA = async (req, res) => {
  const { token } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing' });
  }

  const user2FA = await User2FA.findOne({ where: { userId } });

  if (!user2FA) {
    return res.status(404).json({ error: '2FA record not found' });
  }

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

exports.updateMe = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update(updates);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(404).json({ success: false, error: 'No user with that email' });
  }

  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set fields on user
  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Email config
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
  const message = `You requested a password reset.\n\nClick to reset: ${resetUrl}`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      text: message
    });

    res.json({ success: true, message: 'Reset email sent' });
  } catch (err) {
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
};

exports.resetPassword = async (req, res) => {
  const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    where: {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { [require('sequelize').Op.gt]: Date.now() }
    }
  });

  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully' });
};
exports.changePassword = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  const { currentPassword, newPassword } = req.body;

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, error: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
};