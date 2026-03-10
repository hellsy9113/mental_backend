const express = require('express');
const { submit, getMyApp, withdraw, list, getOne, review } = require('../controller/volunteer.controller');
const { verifyToken, isStudent, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/',                              verifyToken, isStudent, submit);
router.get('/me',                             verifyToken, isStudent, getMyApp);
router.delete('/me',                          verifyToken, isStudent, withdraw);
router.get('/admin/applications',             verifyToken, isAdmin,   list);
router.get('/admin/applications/:id',         verifyToken, isAdmin,   getOne);
router.patch('/admin/applications/:id/review',verifyToken, isAdmin,   review);

module.exports = router;
