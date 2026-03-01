// const express = require("express");
// const { adminDashBoard } = require("../controller/admin.controller");
// const { verifyToken } = require("../middleware/auth.middleware");

// const router = express.Router();

// router.get("/admin", verifyToken,adminDashBoard);

// module.exports = router;



const express = require('express');
const {
  listUsers,
  getUser,
  changeUserRole,
  removeUser,
  assignStudent,
  platformStats
} = require('../controller/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(verifyToken, isAdmin);

router.get('/stats', platformStats);
router.get('/users', listUsers);              // GET /admin/users?role=student
router.get('/users/:id', getUser);            // GET /admin/users/:id
router.patch('/users/:id/role', changeUserRole); // PATCH /admin/users/:id/role
router.delete('/users/:id', removeUser);      // DELETE /admin/users/:id
router.post('/assign', assignStudent);        // POST /admin/assign

module.exports = router;
