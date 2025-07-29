// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/error');
const path = require('path');

const app = express();

// ✅ Test DB connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection error:', err));

// ✅ Middleware: Static files (e.g., images in /public)
app.use('/public', express.static(path.join(__dirname, 'public')));

// ✅ CORS setup
app.use(cors({
  origin: [
    'http://127.0.0.1:5500', 
    'http://localhost:5500'
    'https://cosmicchristglories.vercel.app'
  ],
  credentials: true
}));

// ✅ Headers for static files (image security fix)
app.use('/public', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// ✅ Security headers & logging
app.use(helmet());
app.use(morgan('dev'));

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('✅ Welcome to the Church API!');
});

// ✅ Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// ✅ API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));

// ✅ Error handler
app.use(errorHandler);

module.exports = app;
