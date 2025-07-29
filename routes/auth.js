const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  setup2FA,
  verify2FA,
  // require2FA
} = require('../controllers/authController');

// 2FA routes
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);


// Apply 2FA middleware to sensitive routes
// router.use('/admin', require2FA);

module.exports = router;