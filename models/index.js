const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Import model functions
const defineUser = require('./User');
const defineEvent = require('./Event');
const defineBooking = require('./Booking');
const defineUser2FA = require('./User2FA');
const defineAdminInvite = require('./AdminInvite');
const defineNotification = require('./Notification');

// Initialize models
const User = defineUser(sequelize, Sequelize.DataTypes);
const Event = defineEvent(sequelize, Sequelize.DataTypes);
const Booking = defineBooking(sequelize, Sequelize.DataTypes);
const User2FA = defineUser2FA(sequelize, Sequelize.DataTypes);
const AdminInvite = defineAdminInvite(sequelize, Sequelize.DataTypes);
const Notification = defineNotification(sequelize, Sequelize.DataTypes);

// Set up associations
User.hasMany(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });

Event.hasMany(Booking, { foreignKey: 'eventId' });
Booking.belongsTo(Event, { foreignKey: 'eventId' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Event,
  Booking,
  User2FA,
  AdminInvite,
  Notification
};
