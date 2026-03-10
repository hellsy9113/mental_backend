const VolunteerApplication = require('../models/VolunteerApplication');

async function submitApplication(userId, body) {
  const { userId: _ignored, ...safeBody } = body;
  const existing = await VolunteerApplication.findOne({ userId, status: 'pending' });
  if (existing) { const e = new Error('You already have a pending volunteer application'); e.statusCode = 409; throw e; }
  const approved = await VolunteerApplication.findOne({ userId, status: 'approved' });
  if (approved) { const e = new Error('You are already an approved volunteer'); e.statusCode = 409; throw e; }
  return await VolunteerApplication.create({ userId, ...safeBody });
}

async function getMyApplication(userId) {
  const applications = await VolunteerApplication.find({ userId }).sort({ createdAt: -1 }).limit(1);
  if (!applications.length) { const e = new Error('No volunteer application found'); e.statusCode = 404; throw e; }
  return applications[0];
}

async function withdrawApplication(userId) {
  const application = await VolunteerApplication.findOne({ userId, status: 'pending' });
  if (!application) { const e = new Error('No pending application to withdraw'); e.statusCode = 404; throw e; }
  await application.deleteOne();
  return { message: 'Application withdrawn successfully' };
}

async function listApplications(status) {
  const VALID = ['pending', 'approved', 'rejected'];
  if (status && !VALID.includes(status)) { const e = new Error(`Invalid status. Must be: ${VALID.join(', ')}`); e.statusCode = 400; throw e; }
  const filter = status ? { status } : {};
  return await VolunteerApplication.find(filter).populate('userId', 'name email').sort({ createdAt: -1 });
}

async function getApplicationById(id) {
  let application;
  try { application = await VolunteerApplication.findById(id).populate('userId', 'name email'); }
  catch (castError) { const e = new Error('Invalid application ID format'); e.statusCode = 400; throw e; }
  if (!application) { const e = new Error('Application not found'); e.statusCode = 404; throw e; }
  return application;
}

async function reviewApplication(id, adminId, { status, adminNotes }) {
  if (!status) { const e = new Error('status field is required (approved or rejected)'); e.statusCode = 400; throw e; }
  if (!['approved', 'rejected'].includes(status)) { const e = new Error('Status must be "approved" or "rejected"'); e.statusCode = 400; throw e; }
  let application;
  try { application = await VolunteerApplication.findById(id); }
  catch (castError) { const e = new Error('Invalid application ID format'); e.statusCode = 400; throw e; }
  if (!application) { const e = new Error('Application not found'); e.statusCode = 404; throw e; }
  if (application.status !== 'pending') { const e = new Error(`Application has already been ${application.status}`); e.statusCode = 409; throw e; }
  application.status = status;
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  application.adminNotes = adminNotes ?? '';
  await application.save();
  return application;
}

module.exports = { submitApplication, getMyApplication, withdrawApplication, listApplications, getApplicationById, reviewApplication };
