// src/services/volunteer.services.js
const VolunteerApplication = require('../models/VolunteerApplication');
const CounsellorProfile = require('../models/CounsellorProfile');

// ── Student: Submit application ────────────────────────────────────────────
async function submitApplication(userId, body) {
  // Prevent duplicate pending/assigned applications
  const existing = await VolunteerApplication.findOne({ 
    userId, 
    status: { $in: ['pending', 'assigned'] } 
  });
  if (existing) {
    const error = new Error('You already have an active volunteer application');
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
  // Only allow withdrawal if not yet approved/rejected
  const application = await VolunteerApplication.findOne({ 
    userId, 
    status: { $in: ['pending', 'assigned'] } 
  });
  if (!application) {
    const error = new Error('No active application to withdraw');
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
    .populate('assignedCounsellorId', 'name email')
    .sort({ createdAt: -1 });
  return applications;
}

// ── Admin: Get single application by ID ───────────────────────────────────
async function getApplicationById(id) {
  const application = await VolunteerApplication.findById(id)
    .populate('userId', 'name email')
    .populate('assignedCounsellorId', 'name email');
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }
  return application;
}

// ── Admin: Assign to Counsellor ──────────────────────────────────────────
async function assignToCounsellor(id, adminId, { assignedCounsellorId, adminNotes }) {
  if (!assignedCounsellorId) {
    const error = new Error('assignedCounsellorId is required');
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
    const error = new Error(`Application is in ${application.status} state, cannot assign`);
    error.statusCode = 409;
    throw error;
  }

  application.status = 'assigned';
  application.assignedCounsellorId = assignedCounsellorId;
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  if (adminNotes) application.adminNotes = adminNotes;

  await application.save();
  return application;
}

// ── Counsellor: Review (approve / reject) application ──────────────────────────
async function counsellorReview(id, counsellorId, { status, adminNotes }) {
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

  if (application.status !== 'assigned') {
    const error = new Error('Application is not assigned to any counsellor');
    error.statusCode = 409;
    throw error;
  }

  if (application.assignedCounsellorId.toString() !== counsellorId.toString()) {
    const error = new Error('This application is assigned to a different counsellor');
    error.statusCode = 403;
    throw error;
  }

  application.status = status;
  if (adminNotes) application.adminNotes = adminNotes;

  if (status === 'approved') {
    // Add to counsellor's assignedVolunteers
    await CounsellorProfile.findOneAndUpdate(
      { userId: counsellorId },
      { $addToSet: { assignedVolunteers: application.userId } },
      { upsert: true }
    );
  }

  await application.save();
  return application;
}

// ── Admin / Counsellor: Remove Volunteer ────────────────────────────────────
async function removeVolunteer(appId, userId, userRole) {
  const application = await VolunteerApplication.findById(appId);
  if (!application || application.status !== 'approved') {
    const error = new Error('Approved volunteer application not found');
    error.statusCode = 404;
    throw error;
  }

  // Permission check: Admin can always remove. Counsellor can only if they approved it.
  if (userRole !== 'admin') {
    if (application.assignedCounsellorId.toString() !== userId.toString()) {
      const error = new Error('You do not have permission to remove this volunteer');
      error.statusCode = 403;
      throw error;
    }
  }

  // Remove from CounsellorProfile
  await CounsellorProfile.updateOne(
    { userId: application.assignedCounsellorId },
    { $pull: { assignedVolunteers: application.userId } }
  );

  // Set status back to rejected or specifically 'removed'
  application.status = 'rejected';
  application.adminNotes = `Removed by ${userRole} on ${new Date().toLocaleDateString()}`;
  await application.save();

  return { message: 'Volunteer removed successfully' };
}

module.exports = {
  submitApplication,
  getMyApplication,
  withdrawApplication,
  listApplications,
  getApplicationById,
  assignToCounsellor,
  counsellorReview,
  removeVolunteer
};