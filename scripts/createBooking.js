require('dotenv').config();
const { Booking } = require('../models');
const sequelize = require('../config/db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected...');

    const newBooking = await Booking.create({
      userId: 1,
      eventId: 1,
      eventTitle: 'AI & Tech Conference',
      eventDate: new Date('2025-08-15'),
      eventTime: '10:00 AM',
      attendeeName: 'John Doe',
      attendeeEmail: 'john@example.com',
      attendeePhone: '123-456-7890',
      attendeeLocation: 'New York',
      totalTickets: 2,
      bookingDate: new Date()
    });

    console.log('Booking created:', newBooking.toJSON());
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
