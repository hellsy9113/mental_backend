// src/services/volunteer.services.js
const VolunteerApplication = require('../models/VolunteerApplication');

// ── Student: Submit application ────────────────────────────────────────────
async function submitApplication(userId, body) {
  // Prevent duplicate pending applications
  const existing = await VolunteerApplication.findOne({ userId, status: 'pending' });
  if (existing) {
    const error = new Error('You already have a pending volunteer application');
    error.statusCode = 409;
    throw error;
  }

  const application = await VolunteerApplication.create({ userId, ...body });
  return application;
}

// ── Student: Get own application ───────────────────────────────────────────
async function getMyApplication(userId) {
  const application = await VolunteerApplication.findOne({ userId }).sort({ createdAt: -1 });
  if (!application) {
    const error = new Error('No volunteer application found');
    error.statusCode = 404;
    throw error;
  }
  return application;
}

// ── Student: Withdraw pending application ─────────────────────────────────
async function withdrawApplication(userId) {
  const application = await VolunteerApplication.findOne({ userId, status: 'pending' });
  if (!application) {
    const error = new Error('No pending application to withdraw');
    error.statusCode = 404;
    throw error;
  }
  await application.deleteOne();
  return { message: 'Application withdrawn successfully' };
}

// ── Admin: List all applications (optionally filtered by status) ───────────
async function listApplications(status) {
  const filter = status ? { status } : {};
  const applications = await VolunteerApplication.find(filter)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
  return applications;
}

// ── Admin: Get single application by ID ───────────────────────────────────
async function getApplicationById(id) {
  const application = await VolunteerApplication.findById(id).populate('userId', 'name email');
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }
  return application;
}

// ── Admin: Review (approve / reject) application ──────────────────────────
async function reviewApplication(id, adminId, { status, adminNotes }) {
  const VALID = ['approved', 'rejected'];
  if (!VALID.includes(status)) {
    const error = new Error('Status must be "approved" or "rejected"');
    error.statusCode = 400;
    throw error;
  }

  const application = await VolunteerApplication.findById(id);
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  if (application.status !== 'pending') {
    const error = new Error(`Application has already been ${application.status}`);
    error.statusCode = 409;
    throw error;
  }

  application.status     = status;
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  application.adminNotes = adminNotes || '';

  await application.save();
  return application;
}

module.exports = {
  submitApplication,
  getMyApplication,
  withdrawApplication,
  listApplications,
  getApplicationById,
  reviewApplication
};