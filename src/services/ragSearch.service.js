const { GoogleGenerativeAI } = require("@google/generative-ai");
const Journal = require('../models/Journal');
const mongoose = require('mongoose');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CONFIG = {
  EMBEDDING_MODEL: "text-embedding-004",
  MAX_SEARCH_LIMIT: 10,
  DEFAULT_SIMILARITY_THRESHOLD: 0.70
};

/**
 * Perform a similarity search on the embedded journals using Atlas Vector Search
 *
 * @param {string} userId - Filter by specific User's journal logs
 * @param {string} queryText - User's contextual prompt/query
 * @param {number} topK - The absolute maximum amount to return (to save LLM tokens)
 * @param {number} similarityThreshold - Cutoff below which we ignore standard noise
 * @returns {Array} A list of relevant journal titles & body objects.
 */
async function findSimilarJournals(userId, queryText, topK = 5, similarityThreshold = CONFIG.DEFAULT_SIMILARITY_THRESHOLD) {
  if (!queryText || !queryText.trim()) return [];
  
  // Clean query similarly to our ingestion to keep tokens tight
  const sanitizedQuery = queryText.substring(0, 1000); // 1000 characters is plenty for a semantic search prompt

  // 1. Embed the search query
  const model = genAI.getGenerativeModel({ model: CONFIG.EMBEDDING_MODEL });
  const result = await model.embedContent(sanitizedQuery);
  const queryVector = result.embedding.values;

  // 2. Perform Atlas Vector Search query
  // NOTE: Requires Atlas Vector Index definition configured in Atlas UI.
  const similarJournals = await Journal.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",                  // Must match Atlas custom index name
        path: "embeddingDetails.vector",
        queryVector: queryVector,
        numCandidates: topK * 5,                // Standard safety multiplier required by Atlas
        limit: topK,
        filter: { 
          // ALWAYS block bleeding across different users (massively reduces payload & enforces privacy)
          userId: new mongoose.Types.ObjectId(userId),
          // We only want to search completed embeddings
          "embeddingDetails.status": "completed" 
        }
      }
    },
    {
      // Attach the $meta helper mapping vector closeness to standard numeric score
      $addFields: {
        score: { $meta: "vectorSearchScore" }
      }
    },
    {
      // Drop any matches pulling below your set threshold
      $match: {
         score: { $gte: similarityThreshold }
      }
    },
    {
      // Strict projection to reduce bandwidth / LLM prompt size later.
      $project: {
        _id: 1,
        title: 1,
        body: 1,
        createdAt: 1,
        score: 1
      }
    }
  ]);

  return similarJournals;
}

module.exports = {
  findSimilarJournals
};
