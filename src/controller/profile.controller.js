const User = require('../models/User');

// GET /profile — return own profile (no password)
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /profile — update name, bio, avatarColor
async function updateProfile(req, res) {
  try {
    const allowed = ['name', 'bio', 'avatarColor', 'institution', 'course', 'courseStartYear','profileComplete'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.name && updates.name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    if (updates.courseStartYear !== undefined && updates.courseStartYear !== null && updates.courseStartYear !== '') {
      const yr = Number(updates.courseStartYear);
      if (isNaN(yr) || yr < 1980 || yr > 2100) {
        return res.status(400).json({ success: false, message: 'Invalid course start year' });
      }
      updates.courseStartYear = yr;
    } else if (updates.courseStartYear === '' || updates.courseStartYear === null) {
      updates.courseStartYear = null;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getProfile, updateProfile };