const express = require('express');
const router = express.Router();
const { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getDashboardStats,
  inviteAdmin,
  acceptInvite
} = require('../controllers/adminController');
const { getEvents } = require('../controllers/eventController'); // ✅ Add this
const { protect, authorize } = require('../middleware/auth');
const uploadEventImage = require('../middleware/upload');

router.use(protect);
router.use(authorize('admin'));

router.post('/events', uploadEventImage, createEvent);
router.put('/events/:id', uploadEventImage, updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/events', getEvents); // ✅ Add this
router.get('/dashboard', getDashboardStats);
router.post('/invite', inviteAdmin);
router.post('/accept-invite', acceptInvite);

module.exports = router;
