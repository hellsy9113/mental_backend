const Journal = require('../models/Journal');
const ragSearchService = require('../services/ragSearch.service');

/**
 * Get status of the RAG worker queue
 * Allows dashboard polling
 */
exports.getQueueStatus = async (req, res) => {
  try {
    const stats = await Journal.aggregate([
      {
        $group: {
          _id: "$embeddingDetails.status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format output cleanly into key/value map (e.g., { pending: 5, completed: 100 })
    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id || 'unknown'] = curr.count;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error("[RAG Controller] Error getting queue status:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Manually reset failed embeddings back to pending
 */
exports.retryFailedEmbeddings = async (req, res) => {
  try {
    const result = await Journal.updateMany(
      { "embeddingDetails.status": "failed" },
      {
        $set: {
          "embeddingDetails.status": "pending",
          "embeddingDetails.retries": 0,
          "embeddingDetails.lastError": null
        }
      }
    );

    // Re-trigger the worker explicitly using the global emitter to clear the queue
    Journal.events.emit('journalPending');

    return res.status(200).json({
      success: true,
      message: `Reset ${result.modifiedCount} failed embeddings to pending state.`
    });
  } catch (error) {
    console.error("[RAG Controller] Error retrying failures:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Perform semantic search across user's journals
 */
exports.searchJournals = async (req, res) => {
  try {
    const { query, limit, threshold } = req.body;
    const userId = req.user.id; // Assumes auth middleware populates req.user

    if (!query) {
      return res.status(400).json({ success: false, message: "Query text is required" });
    }

    const results = await ragSearchService.findSimilarJournals(
      userId, 
      query, 
      limit || 5, 
      threshold || 0.70
    );

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error("[RAG Controller] Error searching journals:", error);
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
};
