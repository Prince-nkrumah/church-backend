const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    eventTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    eventTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    attendeeName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    attendeeEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    attendeePhone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    attendeeLocation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalTickets: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bookingDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return Booking;
};