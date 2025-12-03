
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

// MongoDB Connection
// Default mock string if .env is missing for initial run safety
const MONGO_URI = 'mongodb+srv://shreeganesh4970799_db_user:65TsqUbxo15XEs9W@cluster0.s8dr3al.mongodb.net/?appName=Bookbridge';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('BookBridge API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
