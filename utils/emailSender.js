const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendBookingConfirmation = async (booking) => {
  try {
    const mailOptions = {
      from: `"Event Booking System" <${process.env.GMAIL_USER}>`,
      to: booking.attendee.email,
      subject: `Booking Confirmation: ${booking.eventTitle}`,
      html: `
        <h1>Booking Confirmation</h1>
        <p>Dear ${booking.attendee.name},</p>
        <p>Your booking for ${booking.totalTickets} ticket(s) to "${booking.eventTitle}" has been confirmed.</p>
        <h3>Event Details</h3>
        <ul>
          <li>Event: ${booking.eventTitle}</li>
          <li>Date: ${booking.eventDate}</li>
          <li>Time: ${booking.eventTime}</li>
        </ul>
        <h3>Attendee Details</h3>
        <ul>
          <li>Name: ${booking.attendee.name}</li>
          <li>Email: ${booking.attendee.email}</li>
          <li>Phone: ${booking.attendee.phone}</li>
          <li>Location: ${booking.attendee.location}</li>
        </ul>
        <p>Booking reference: ${booking.id}</p>
        <p>Thank you for your booking!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation,
};