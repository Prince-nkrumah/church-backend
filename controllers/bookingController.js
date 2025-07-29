const { Booking, Event } = require('../models');
const { sendBookingConfirmation } = require('../utils/emailSender');
const { Op } = require('sequelize');


exports.createBooking = async (req, res, next) => {
  try {
    const { eventId, attendee, totalTickets } = req.body;

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Create booking
    const booking = await Booking.create({
      eventId,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      attendeePhone: attendee.phone,
      attendeeLocation: attendee.location,
      totalTickets,
      userId: req.user?.id || null
    });

    // Send confirmation email
    await sendBookingConfirmation({
      id: booking.id,
      eventTitle: booking.eventTitle,
      eventDate: booking.eventDate,
      eventTime: booking.eventTime,
      attendee: {
        name: booking.attendeeName,
        email: booking.attendeeEmail,
        phone: booking.attendeePhone,
        location: booking.attendeeLocation
      },
      totalTickets: booking.totalTickets
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const {
      eventId,
      dateStart,
      dateEnd,
      search,
      page = 1,
      limit = 10
    } = req.query;

    console.log('📥 Query Params:', req.query);

    const where = {};

    if (eventId) where.eventId = eventId;

    if (dateStart && dateEnd) {
      where.bookingDate = {
        [Op.between]: [new Date(dateStart), new Date(dateEnd)],
      };
    }

    if (search) {
      where[Op.or] = [
        { attendeeName: { [Op.iLike]: `%${search}%` } },
        { attendeeEmail: { [Op.iLike]: `%${search}%` } },
        { attendeePhone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: Event,
          attributes: ['title', 'date', 'time', 'location'],
        },
      ],
      order: [['bookingDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    next(error);
  }
};
