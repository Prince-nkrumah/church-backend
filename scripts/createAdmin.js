const { User, User2FA } = require('../models');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
require('dotenv').config();

(async () => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (adminExists) {
      console.log('⚠️ Admin already exists:', adminExists.email);
      process.exit(0);
    }

    // Create admin
    const admin = await User.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_INITIAL_PASSWORD,
      role: 'admin',
      isVerified: true
    });

    // Generate 2FA secret (admin must enable later)
    const secret = speakeasy.generateSecret({ length: 20 });
    await User2FA.create({
      userId: admin.id,
      secret: secret.base32,
      backupCodes: Array(5).fill().map(() => Math.random().toString(36).slice(2, 10)),
      isEnabled: false
    });

    console.log('✅ **First Admin Created**');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Temporary Password: ${process.env.ADMIN_INITIAL_PASSWORD}`);
    console.log('\n⚠️ **Change this password immediately & enable 2FA!**');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  }
})();