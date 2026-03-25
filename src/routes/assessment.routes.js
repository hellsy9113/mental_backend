const express = require('express');
const { getRecentAssessment } = require('../controller/assessment.controller');
const { verifyToken, isStudent } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(verifyToken);

/**
 * @route GET /api/assessment/recent
 * @desc Get the most recent assessment for the student
 * @access Private (Student)
 */
router.get('/recent', getRecentAssessment);

module.exports = router;
