const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Atlas Connected Successfully for SERVEXA!'))
  .catch((err) => console.error('Database Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'SERVEXA - eService Hub Backend API is running successfully!' 
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add this near your imports in server.js
const serviceRoutes = require('./routes/serviceRoutes');

// Add this with your other middleware/routes
app.use('/api/services', serviceRoutes);

const operatorRoutes = require('./routes/operatorRoutes');
app.use('/api/operator', operatorRoutes);