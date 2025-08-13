const { Event, Booking } = require('../models');
const { processImage } = require('../utils/imageProcessor');
const crypto = require('crypto');
const { User, AdminInvite } = require('../models');
const { sendEmail } = require('../utils/emailSender');
const bcrypt = require('bcryptjs'); // or 'bcrypt' if you're using that



exports.inviteAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    // Check for existing pending invite
    let invite = await AdminInvite.findOne({ where: { email } });

    if (invite) {
      if (invite.status === 'pending') {
        const inviteLink = `${process.env.FRONTEND_URL}/admin/accept-invite?token=${invite.token}`;
        await sendEmail({
          to: email,
          subject: 'Reminder: Admin Invite to Cosmic Christ Glories Church',
          html: `Click <a href="${inviteLink}">here</a> to accept. Expires on ${invite.expiresAt}.`
        });
        return res.json({ success: true, message: 'Invite already sent, resent email' });
      } else {
        return res.status(400).json({ error: 'This email has already been invited and accepted/rejected.' });
      }
    }

    // Create new invite
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
    invite = await AdminInvite.create({ email, token, expiresAt });

    const inviteLink = `${process.env.FRONTEND_URL}/admin/accept-invite?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'You’re invited as an Admin to Cosmic Christ Glories Church',
      html: `Click <a href="${inviteLink}">here</a> to accept. Expires in 48h.`
    });

    res.json({ success: true, message: 'Invite sent' });
  } catch (error) {
    console.error('💥 Invite Error:', error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
};



exports.acceptInvite = async (req, res) => {
  try {
    const { token, password, name } = req.body;

    const invite = await AdminInvite.findOne({ where: { token } });

    if (!invite || invite.expiresAt < new Date() || invite.status === 'accepted') {
      return res.status(400).json({ error: 'Invalid, expired, or already used token' });
    }

    // No need to hash password here!
    const admin = await User.create({
      name: name || 'Admin',
      email: invite.email,
      password, 
      role: 'admin',
      isVerified: true
    });

    await invite.update({ status: 'accepted' });

    res.json({ success: true, message: 'Admin account created' });
  } catch (error) {
    console.error('Error in acceptInvite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
};

exports.getAdmins = async (req, res, next) => {
    try {
        // Find all users with the role of 'admin'
        const admins = await User.findAll({
            where: { role: 'admin' },
            attributes: ['id', 'email', 'name'] // Select the fields you need
        });

        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins,
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteAdmin = async (req, res, next) => {
  try {
    const adminId = parseInt(req.params.id, 10);

    if (req.user.id === adminId) {
      return res.status(403).json({ message: 'You cannot delete yourself.' });
    }

    const admin = await User.findByPk(adminId);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await admin.destroy();

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    next(error);
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
    attributes: ['id', 'eventId', 'attendeeName', 'attendeeEmail', 'bookingDate'],
    order: [['bookingDate', 'DESC']],
    limit: 5,
    include: [
      {
        model: Event,
        attributes: ['title', 'date', 'time']
      }
    ]
  });


    console.log(recentBookings.map(b => ({
      bookingId: b.id,
      userId: b.userId,
      user: b.User
    })));


const formattedBookings = recentBookings.map(booking => {
  const rawDate = booking.bookingDate || booking.createdAt;

  const formattedCreatedAt = rawDate
    ? new Date(rawDate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).replace(',', ' –')
    : 'N/A';

  // Combine and format eventDate + eventTime
  const combinedEventDateTime = booking.Event?.date && booking.Event?.time
    ? new Date(`${booking.Event.date}T${booking.Event.time}`).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).replace(',', ' –')
    : 'N/A';

  return {
    id: booking.id,
    eventId: booking.eventId,
    eventTitle: booking.Event?.title,
    eventDate: combinedEventDateTime, // ✅ update this line
    fullName: booking.attendeeName || 'N/A',
    email: booking.attendeeEmail || 'N/A',
    createdAt: formattedCreatedAt
  };
});



    console.log("📤 Final Response:", {
      totalBookings,
      totalEvents,
      totalTickets,
      todayBookings,
      recentBookings: formattedBookings
    });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        totalEvents,
        totalTickets,
        todayBookings,
        recentBookings: formattedBookings // ✅ return the formatted version
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
};

