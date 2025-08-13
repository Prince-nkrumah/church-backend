const express = require('express');
const router = express.Router();
const { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getDashboardStats,
  inviteAdmin,
  acceptInvite,
  getAdmins,
  deleteAdmin
} = require('../controllers/adminController');
const { getEvents } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const uploadEventImage = require('../middleware/upload');

// 🔓 Public route — should NOT require JWT
router.post('/accept-invite', acceptInvite);

// 🔐 Protected routes
router.use(protect);
router.use(authorize('admin'));
router.delete('/admin/:id', protect, authorize('admin'), deleteAdmin);



router.get('/admins', getAdmins);

router.post('/events', uploadEventImage, createEvent);
router.put('/events/:id', uploadEventImage, updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/events', getEvents);
router.get('/dashboard', getDashboardStats);
router.post('/invite', inviteAdmin);

module.exports = router;
