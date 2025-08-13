const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const authenticate = require('../middleware/authenticate');

// Get all notifications for logged-in admin
router.get('/', authenticate, async (req, res) => {
  console.log('Logged-in user:', req.user);

  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });

  // Map DB 'read' field to frontend 'isRead'
  const formatted = notifications.map(n => ({
    ...n.toJSON(),
    isRead: n.read,
  }));

  res.json(formatted);
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);

  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  notification.read = true;
  await notification.save();

  res.json({ message: 'Notification marked as read' });
});

module.exports = router;
