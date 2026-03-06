const express = require('express');
const {
  create,
  list,
  getOne,
  update,
  remove,
  calendar,
  ragExport
} = require('../controller/journal.controller');
const { verifyToken, isStudent } = require('../middleware/auth.middleware');

const router = express.Router();

// All journal routes: authenticated students only
router.use(verifyToken, isStudent);

router.post('/',                  create);      // Create new entry
router.get('/',                   list);        // List entries (optionally filtered by month/year)
router.get('/calendar',           calendar);    // Calendar summary — days with entries
router.get('/rag',                ragExport);   // RAG export — monthly plain-text chunks
router.get('/:id',                getOne);      // Get single entry
router.patch('/:id',              update);      // Edit entry
router.delete('/:id',             remove);      // Delete entry

module.exports = router;