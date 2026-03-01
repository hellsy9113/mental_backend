const express = require('express');
const { getProfile, updateProfile, viewStudentDashboard } = require('../controller/counsellor.controller');
const { verifyToken, isCounsellor } = require('../middleware/auth.middleware');

const router = express.Router();

// All counsellor routes require authentication + counsellor role
router.get('/profile', verifyToken, isCounsellor, getProfile);
router.patch('/profile', verifyToken, isCounsellor, updateProfile);

// View dashboard of an assigned student
router.get('/students/:studentId', verifyToken, isCounsellor, viewStudentDashboard);

module.exports = router;
