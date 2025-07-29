// server.js
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');

// Use environment port or fallback to 5000
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate(); // Optional: confirm connection before sync
    console.log('✅ Database connected.');

    await sequelize.sync({ alter: true }); // Use alter only when needed
    console.log('✅ Database synced successfully.');

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1); // Exit clearly if anything fails
  }
})();
