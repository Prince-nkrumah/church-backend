require('dotenv').config();
const { Event } = require('../models'); // adjust if your model path is different
const sequelize = require('../models').sequelize;

async function fixEventImagePaths() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB');

    const events = await Event.findAll();

    for (const event of events) {
      if (event.imageUrl && event.imageUrl.startsWith('public')) {
        const cleanedPath = event.imageUrl
          .replace(/^public[\\/]/, '') // remove 'public/' or 'public\\'
          .replace(/\\/g, '/'); // convert backslashes to slashes

        event.imageUrl = cleanedPath;
        await event.save();
        console.log(`✅ Updated: ${event.title} → ${cleanedPath}`);
      }
    }

    console.log('🎉 All image paths cleaned.');
    process.exit();
  } catch (err) {
    console.error('❌ Error fixing image paths:', err);
    process.exit(1);
  }
}

fixEventImagePaths();
