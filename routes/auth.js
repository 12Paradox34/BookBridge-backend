
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify Token
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

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(name,email,password);

    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    const savedUser = await user.save();
    
    // Create Token
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET || "rajiv", { expiresIn: '7d' });

    // Return user without password
    const { password: _, ...userData } = savedUser._doc;
    res.status(201).json({ user: { id: savedUser._id, ...userData }, token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Email or password incorrect' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Email or password incorrect' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userData } = user._doc;
    res.json({ user: { id: user._id, ...userData }, token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PROFILE
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Map _id to id for frontend consistency
    const { _id, ...rest } = user._doc;
    res.json({ id: _id, ...rest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PROFILE
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { phone, address, city, pincode, preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { phone, address, city, pincode, preferences },
      { new: true }
    ).select('-password');

    const { _id, ...rest } = user._doc;
    res.json({ id: _id, ...rest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
