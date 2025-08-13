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

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to your frontend origin
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.set('trust proxy', 1);

// ✅ CORS setup
app.use(cors({
  origin: [
    'http://127.0.0.1:5500', 
    'http://127.0.0.1:5501', 
    'http://localhost:5500',
    'https://cosmicchristglories.vercel.app'
  ],
  credentials: true
}));



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
app.use('/api/notifications', require('./routes/notifications'));

// ✅ Error handler
app.use(errorHandler);

module.exports = app;
