const express = require('express');
const router = express.Router();
const { createBooking, getBookings } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { Booking, Event, User } = require('../models');

router.post('/', createBooking);
router.get('/', getBookings);

router.get('/recent', protect, async (req, res) => {
  try {
    const recentBookings = await Booking.findAll({
      order: [['bookingDate', 'DESC']],
      limit: 5,
      include: [
        { model: Event, attributes: ['title'] },
        { model: User, attributes: ['name'] }
      ]
    });

    // Format to what your frontend expects
    const formatted = recentBookings.map(b => ({
      id: b.id,
      userName: b.User?.name || b.attendeeName,
      eventTitle: b.Event?.title || b.eventTitle,
      bookingDate: b.bookingDate || b.createdAt,
    }));

    res.status(200).json({ data: formatted }); // ✅ use `data`, not `bookings`
  } catch (error) {
    console.error("Recent bookings error:", error);
    res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
});

module.exports = router;