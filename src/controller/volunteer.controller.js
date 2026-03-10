const { submitApplication, getMyApplication, withdrawApplication, listApplications, getApplicationById, reviewApplication } = require('../services/volunteer.services');

async function submit(req, res) {
  try { const app = await submitApplication(req.user.id, req.body); res.status(201).json({ success: true, message: 'Volunteer application submitted successfully', data: app }); }
  catch (e) { res.status(e.statusCode || 500).json({ success: false, message: e.message || 'Server error' }); }
}
async function getMyApp(req, res) {
  try { const app = await getMyApplication(req.user.id); res.status(200).json({ success: true, data: app }); }
  catch (e) { res.status(e.statusCode || 500).json({ success: false, message: e.message || 'Server error' }); }
}
async function withdraw(req, res) {
  try { const result = await withdrawApplication(req.user.id); res.status(200).json({ success: true, message: result.message }); }
  catch (e) { res.status(e.statusCode || 500).json({ success: false, message: e.message || 'Server error' }); }
}
async function list(req, res) {
  try { const apps = await listApplications(req.query.status); res.status(200).json({ success: true, count: apps.length, data: apps }); }
  catch (e) { res.status(e.statusCode || 500).json({ success: false, message: e.message || 'Server error' }); }
}
async function getOne(req, res) {
  try { const app = await getApplicationById(req.params.id); res.status(200).json({ success: true, data: app }); }
  catch (e) { res.status(e.statusCode || 500).json({ success: false, message: e.message || 'Server error' }); }
}
async function review(req, res) {
  try { const app = await reviewApplication(req.params.id, req.user.id, req.body); res.status(200).json({ success: true, message: `Application ${app.status} successfully`, data: app }); }
  catch (e) { res.status(e.statusCode || 500).json({ success: false, message: e.message || 'Server error' }); }
}

module.exports = { submit, getMyApp, withdraw, list, getOne, review };
