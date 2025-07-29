require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function resetAdminPassword() {
  try {
    const newPlainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPlainPassword, 12);

    const admin = await User.findOne({ where: { email: 'cosmic@gmail.com' } });

    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Admin password reset successfully!');
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword();
