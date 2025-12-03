
const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Exam Prep', 'School Textbooks', 'Novels/Fiction', 'Reference', 'Other']
  },
  examType: {
    type: String,
    default: 'General Reading'
  },
  condition: {
    type: String,
    required: true,
    enum: ['Like New', 'Good', 'Fair', 'Readable']
  },
  price: {
    type: Number,
    required: true
  },
  mrp: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: true
  },
  images: {
    type: [String], // Array of image URLs
    default: []
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'available',
    enum: ['available', 'sold']
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Listing', ListingSchema);
