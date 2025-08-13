const { Booking, Event, User, Notification } = require('../models');
const { sendBookingConfirmation } = require('../utils/emailSender');
const notifyAdmins = require('../utils/notifyAdmins');
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

    await notifyAdmins({
      message: `New booking for event: ${event.title}`,
      type: 'booking'
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

    const bookings = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: Event,
          attributes: ['title', 'date', 'time', 'location'],
        },
        {
          model: User,
          attributes: ['name', 'email']
        }
      ],
      order: [['bookingDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    // ✅ Map raw bookings to formatted output
    const formatted = bookings.rows.map(booking => ({
      id: booking.id,
      eventId: booking.eventId,
      eventTitle: booking.eventTitle,
      eventDate: booking.eventDate,
      fullName: booking.attendeeName,
      email: booking.attendeeEmail,
      status: booking.status,
      bookingDate: booking.bookingDate
    }));

    res.status(200).json({
      success: true,
      count: bookings.count,
      data: formatted
    });


  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    next(error);
  }
};
