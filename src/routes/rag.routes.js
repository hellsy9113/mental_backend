const express = require('express');
const router = express.Router();
const ragController = require('../controller/rag.controller');

const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// Get the current queue backlog/status numbers
router.get('/jobs/status', ragController.getQueueStatus);

// Manually reset failed embedding tasks
router.post('/jobs/retry', ragController.retryFailedEmbeddings);

// Semantic search via RAG layer
router.post('/search', ragController.searchJournals);

module.exports = router;
