
const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const Listing = require('../models/Listing');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};

// Cloudinary Configuration
cloudinary.config({
  cloud_name: dwl5b4xda,
  api_key: 826956653251315,
  api_secret: 9QuT7gji36gNK-6vV3n6M4j0wIE
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bookbridge_listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 1000, crop: 'limit' }] // Resize for optimization
  },
});

const upload = multer({ storage: storage });

// CREATE LISTING
router.post('/new', authenticateToken, async (req, res) => {
  try {
    const listing = new Listing({
      user: req.user.id,
      ...req.body
    });
    
    const savedListing = await listing.save();
    // Populate user info before returning
    await savedListing.populate('user', 'name email avatar city rating');
    
    // Format response to match frontend types
    const response = {
       ...savedListing._doc,
       id: savedListing._id,
       seller: savedListing.user
    };

    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD IMAGES
router.post('/images', authenticateToken, upload.array('images', 5), (req, res) => {
  try {
    // Cloudinary storage automatically puts the secure URL in file.path
    const fileUrls = req.files.map(file => file.path);
    res.json({ urls: fileUrls });
  } catch (error) {
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// GET ALL LISTINGS
router.get('/', async (req, res) => {
  try {
    const { search, category, exam, minPrice, maxPrice, sort } = req.query;
    
    let query = { status: 'available' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'All') query.category = category;
    if (exam && exam !== 'All') query.examType = exam;
    if (maxPrice) query.price = { $lte: parseInt(maxPrice) };

    let sortOption = { created_at: -1 }; // Newest default
    if (sort === 'price_low') sortOption = { price: 1 };
    
    const listings = await Listing.find(query)
      .populate('user', 'name email avatar city rating')
      .sort(sortOption);

    const formatted = listings.map(l => ({
      ...l._doc,
      id: l._id,
      seller: l.user
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET MY LISTINGS
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const listings = await Listing.find({ user: req.user.id })
      .populate('user', 'name email avatar')
      .sort({ created_at: -1 });

    const formatted = listings.map(l => ({
      ...l._doc,
      id: l._id,
      seller: l.user
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE LISTING
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Optional: Delete images from Cloudinary here if needed, requires extracting public_id

    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE STATUS
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    if (listing.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    listing.status = req.body.status;
    await listing.save();
    
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
