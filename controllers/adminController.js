const { Event, Booking } = require('../models');
const { processImage } = require('../utils/imageProcessor');
const crypto = require('crypto');
const { User, AdminInvite } = require('../models');
const { sendEmail } = require('../utils/emailSender');
const bcrypt = require('bcryptjs'); // or 'bcrypt' if you're using that



exports.inviteAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h expiry

    // Create invite
    await AdminInvite.create({ email, token, expiresAt });

    // Send email
    const inviteLink = `${process.env.FRONTEND_URL}/admin/accept-invite?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'You’re invited as an Admin',
      html: `Click <a href="${inviteLink}">here</a> to accept. Expires in 48h.`
    });

    res.json({ success: true, message: 'Invite sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send invite' });
  }
};


exports.acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate invite
    const invite = await AdminInvite.findOne({ where: { token } });
    if (!invite || invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Create admin
    const admin = await User.create({
      email: invite.email,
      password: await bcrypt.hash(password, 12),
      role: 'admin',
      isVerified: true
    });

    // Mark invite as used
    await invite.update({ status: 'accepted' });

    res.json({ success: true, message: 'Admin account created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept invite' });
  }
};


exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, time, location, availableTickets } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = await processImage(req.file.path);
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      location,
      availableTickets,
      imageUrl,
      status: 'published'
    });
    
    res.status(201).json({
      success: true,
      data: event
    });

    console.log("Event created:", event)
  } catch (error) {
     console.error("Create Event Error:", error);
      return res.status(500).json({ success: false, message: 'Something went wrong!' });
  }

};

exports.updateEvent = async (req, res, next) => {
  try {
    const { title, description, date, time, location, availableTickets, status } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = await processImage(req.file.path);
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.location = location || event.location;
    event.availableTickets = availableTickets || event.availableTickets;
    event.status = status || event.status;
    if (imageUrl) event.imageUrl = imageUrl;

    await event.save();

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    await event.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};


exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalBookings = await Booking.count();
    const totalEvents = await Event.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayBookings = await Booking.count({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: today,
          [require('sequelize').Op.lt]: tomorrow
        }
      }
    });

    const allBookings = await Booking.findAll();
    const totalTickets = allBookings.reduce((acc, booking) => {
      return acc + (booking.totalTickets || 1); // adjust if your field is named differently
    }, 0);

    const recentBookings = await Booking.findAll({
      order: [['bookingDate', 'DESC']],
      limit: 5,
      include: [
        {
          model: Event,
          attributes: ['title']
        }
      ]
    });

    console.log('Dashboard Stats:', { totalBookings, totalEvents, totalTickets, todayBookings });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        totalEvents,
        totalTickets,
        todayBookings,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
};

