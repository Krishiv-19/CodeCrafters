// --- server.js (Main Application File Example) ---
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');

// Middleware
app.use(bodyParser.json());

// Main Authentication Route: The Login Dashboard entry point
app.use('/api/auth', authRoutes); 

// ... other routes (expenses, admin, etc.) ...

// app.listen(3000, () => console.log('Server running on port 3000'));