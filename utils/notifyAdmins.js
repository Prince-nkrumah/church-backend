// utils/notifyAdmins.js
const { User, Notification } = require('../models');

async function notifyAdmins({ message, type }) {
  const admins = await User.findAll({ where: { role: 'admin' } });

  const notifications = admins.map((admin) => ({
    userId: admin.id,
    message,
    type,
  }));

  await Notification.bulkCreate(notifications);
}

module.exports = notifyAdmins;
