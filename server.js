const express = require('express');  
const mongoose = require('mongoose');  
const cors = require('cors');  
require('dotenv').config();  

// 1. Initialize Express FIRST
const app = express();  

// 2. Middleware  
app.use(express.json());  
app.use(cors());  

// 3. Route Imports
const serviceRoutes = require('./routes/serviceRoutes');
const operatorRoutes = require('./routes/operatorRoutes');

// 4. Route Registration (Always after app initialization)
app.use('/api/services', serviceRoutes);
app.use('/api/operator', operatorRoutes);

// 5. Database Connection & Port Setup  
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
