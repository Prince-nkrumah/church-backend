const express = require('express');
const router = express.Router();
const { createBooking, getBookings } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/', createBooking);
router.get('/', protect, getBookings);

router.get('/recent', protect, async (req, res) => {
  try {
    const recentBookings = await Booking.findAll({
      order: [['bookingDate', 'DESC']],
      limit: 5,
      include: [{ model: Event, attributes: ['title'] }]
    });

    res.status(200).json({ bookings: recentBookings });
  } catch (error) {
    console.error("Recent bookings error:", error);
    res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
});

module.exports = router;