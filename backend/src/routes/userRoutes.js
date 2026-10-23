const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (fullName) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
