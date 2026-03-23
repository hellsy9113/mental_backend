// src/controller/volunteer.controller.js
const {
  submitApplication,
  getMyApplication,
  withdrawApplication,
  listApplications,
  getApplicationById,
  assignToCounsellor,
  counsellorReview,
  removeVolunteer
} = require('../services/volunteer.services');

// POST /api/volunteer
// Student submits their application
async function submit(req, res) {
  try {
    const application = await submitApplication(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Volunteer application submitted successfully',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

// GET /api/volunteer/me
// Student views their own application
async function getMyApp(req, res) {
  try {
    const application = await getMyApplication(req.user.id);
    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

// DELETE /api/volunteer/me
// Student withdraws their pending application
async function withdraw(req, res) {
  try {
    const result = await withdrawApplication(req.user.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

// GET /api/volunteer/admin/applications?status=pending
// Admin or Counsellor lists applications
async function list(req, res) {
  try {
    const { status } = req.query;
    const applications = await listApplications(status);
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

// GET /api/volunteer/admin/applications/:id
// Admin/Counsellor views a single application
async function getOne(req, res) {
  try {
    const application = await getApplicationById(req.params.id);
    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

// PATCH /api/volunteer/admin/assign/:id
// Admin assigns an application to a counsellor
async function assign(req, res) {
  try {
    const application = await assignToCounsellor(req.params.id, req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Application assigned to counsellor successfully',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

// PATCH /api/volunteer/counsellor/review/:id
// Counsellor approves or rejects an assigned application
async function cReview(req, res) {
  try {
    const application = await counsellorReview(req.params.id, req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: `Volunteer application ${application.status} successfully`,
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

// DELETE /api/volunteer/remove/:id
// Admin or assigned Counsellor removes an approved volunteer
async function remove(req, res) {
  try {
    const result = await removeVolunteer(req.params.id, req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

module.exports = { submit, getMyApp, withdraw, list, getOne, assign, cReview, remove };