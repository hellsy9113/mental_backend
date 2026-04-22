const { GoogleGenerativeAI } = require("@google/generative-ai");
const Journal = require('../models/Journal');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CONFIG = {
  BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  EMBEDDING_MODEL: "text-embedding-004",
  METADATA_MODEL: "gemini-1.5-flash",
  TRUNCATE_LIMIT: 8000,
  POLL_INTERVAL_MS: 5 * 60 * 1000 // 5 minutes fallback polling
};

let isProcessing = false;

/**
 * Truncates and cleans the journal text to prevent token explosion.
 */
function prepareTextForEmbedding(title, body) {
  const rawText = `Title: ${title || 'Untitled'}\nBody: ${body || ''}`;
  // Avoid sending insanely large documents to the model
  if (rawText.length > CONFIG.TRUNCATE_LIMIT) {
    return rawText.substring(0, CONFIG.TRUNCATE_LIMIT);
  }
  return rawText;
}

/**
 * Main worker loop to process pending entries.
 * Uses atomic updates to lock documents instantly.
 */
async function processPendingEmbeddings() {
  if (isProcessing) return; // Prevent overlapping runs in this specific process
  isProcessing = true;

  try {
    let journalsToProcess = [];

    // Atomically find & lock up to BATCH_SIZE documents so multiple processes don't duplicate work
    for (let i = 0; i < CONFIG.BATCH_SIZE; i++) {
      const doc = await Journal.findOneAndUpdate(
        { 'embeddingDetails.status': 'pending' },
        { $set: { 'embeddingDetails.status': 'processing' } },
        { new: true, select: '_id title body embeddingDetails' }
      );
      if (!doc) break;
      journalsToProcess.push(doc);
    }

    if (journalsToProcess.length === 0) {
      isProcessing = false;
      return; // Queue is empty
    }

    const startTime = Date.now();
    console.log(`[RAG Worker] Picked up ${journalsToProcess.length} journals for embedding...`);

    const embeddingModel = genAI.getGenerativeModel({ model: CONFIG.EMBEDDING_MODEL });
    const analysisModel = genAI.getGenerativeModel({ model: CONFIG.METADATA_MODEL });

    // Process all sequentially or with restrained parallelization to respect Gemini burst limits
    // We use Promise.all but the batch size itself acts as the burst cap.
    const embeddingPromises = journalsToProcess.map(async (doc) => {
      try {
        const textToEmbed = prepareTextForEmbedding(doc.title, doc.body);

        // Gemini 1: Vector Embedding
        console.log(`[RAG Worker] Embedding journal ${doc._id}...`);
        const embedResult = await embeddingModel.embedContent(textToEmbed);
        const vector = embedResult.embedding.values;
        console.log(`[RAG Worker] Vector generated for ${doc._id} (len: ${vector.length})`);

        // Gemini 2: Emotional Analysis & Topic Extraction
        console.log(`[RAG Worker] Analyzing metadata for ${doc._id}...`);
        let metadata = {
          emotion: 'Unknown',
          sentiment: 'Neutral',
          topics: []
        };

        try {
          const prompt = `Analyze this journal entry and return a JSON object with: 
          "emotion" (single dominant emotion like Anxiety, Joy, Sadness, Calm), 
          "sentiment" (Positive, Negative, or Neutral), 
          "topics" (array of 1-3 short strings representing key themes like Exam Stress, Relationships, Growth).
          
          Only return the raw JSON object, no markdown.
          Journal Content: "${textToEmbed.substring(0, 2000)}"`;

          const analyzeResult = await analysisModel.generateContent(prompt);
          const rawText = analyzeResult.response.text().trim();
          // Stripping potential markdown json code blocks
          const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(jsonText);
          
          metadata = {
            emotion: parsed.emotion || 'Unknown',
            sentiment: parsed.sentiment || 'Neutral',
            topics: Array.isArray(parsed.topics) ? parsed.topics : []
          };
        } catch (mErr) {
          console.warn(`[RAG Worker] Metadata extraction failed for ${doc._id}:`, mErr.message);
          // Keep default metadata if analysis fails to avoid blocking the vector storage
        }

        // Mark completed with both vector and metadata
        await Journal.updateOne(
          { _id: doc._id },
          {
            $set: {
              'embeddingDetails.status': 'completed',
              'embeddingDetails.vector': vector,
              'embeddingDetails.model': CONFIG.EMBEDDING_MODEL,
              'embeddingDetails.lastError': null,
              'embeddingDetails.metadata': metadata
            }
          }
        );
      } catch (error) {
        console.error(`[RAG Worker] Failed to embed journal ${doc._id}:`, error.message);
        
        const newRetries = (doc.embeddingDetails.retries || 0) + 1;
        const newStatus = newRetries >= CONFIG.MAX_RETRIES ? 'failed' : 'pending';

        await Journal.updateOne(
          { _id: doc._id },
          {
            $set: {
              'embeddingDetails.status': newStatus,
              'embeddingDetails.retries': newRetries,
              'embeddingDetails.lastError': error.message
            }
          }
        );
      }
    });

    await Promise.all(embeddingPromises);

    const timeTaken = Date.now() - startTime;
    console.log(`[RAG Worker] Completed batch of ${journalsToProcess.length} in ${timeTaken}ms.`);

    // If we maxed out the batch, there might be more sitting in the queue. 
    // Trigger it again immediately until queue clears.
    if (journalsToProcess.length === CONFIG.BATCH_SIZE) {
      isProcessing = false;
      setTimeout(processPendingEmbeddings, 1000); // 1-second delay throttle
      return;
    }

  } catch (error) {
    console.error("[RAG Worker] Critical generic error during processing:", error.message);
  } finally {
    isProcessing = false;
  }
}

// Subscribe to saves so the worker triggers immediately
Journal.events.on('journalPending', () => {
  // Use a slight timeout so DB save fully resolves first
  setTimeout(processPendingEmbeddings, 500);
});

// Start the fallback poller interval
function startWorkerInterval() {
  console.log("[RAG Worker] Background interval polling initialized.");
  setInterval(processPendingEmbeddings, CONFIG.POLL_INTERVAL_MS);
}

module.exports = {
  processPendingEmbeddings,
  startWorkerInterval
};
