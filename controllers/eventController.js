const { Event } = require('../models');
const { Op } = require('sequelize');
const { processImage } = require('../utils/imageProcessor');

exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: {
        status: 'published',
        date: { [Op.gte]: new Date() }
      },
      order: [['date', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};