const express = require('express');
const { getProfile, updateProfile } = require('../controller/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Any authenticated role can access their own profile
router.get('/',     verifyToken, getProfile);
router.patch('/',   verifyToken, updateProfile);

module.exports = router;