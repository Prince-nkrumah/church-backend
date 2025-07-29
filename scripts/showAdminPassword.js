require('dotenv').config();
const { sequelize, User } = require('../models');

async function showAdminPassword() {
  const admin = await User.findOne({ where: { email: 'admin@yourapp.com' } });
  if (!admin) return console.log('Admin not found');

  console.log('Stored hashed password:', admin.password);
  await sequelize.close();
}

showAdminPassword();
