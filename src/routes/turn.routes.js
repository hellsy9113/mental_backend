/**
 * src/routes/turn.routes.js
 *
 * Fetches short-lived TURN credentials from Cloudflare Calls API.
 * Cloudflare docs: https://developers.cloudflare.com/calls/turn/
 */

const https = require('https');
const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const router = express.Router();

// TURN credentials should only be issued to authenticated users
router.use(verifyToken);

/**
 * Returns an array of RTCIceServer objects ready for use in RTCPeerConnection.
 */
async function getTurnCredentials(req, res) {
  const tokenId  = process.env.CF_TURN_TOKEN_ID || process.env.CF_TURN_KEY_ID;
  const apiToken = process.env.CF_TURN_API_TOKEN;

  // 1. Check for missing ENV vars
  if (!tokenId || !apiToken) {
    console.warn('[TURN] CF_TURN_TOKEN_ID or CF_TURN_API_TOKEN not set — returning STUN only');
    return res.json({
      success: true,
      iceServers: [
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
  }

  try {
    // 2. Fetch from Cloudflare REST API
    const cfResponse = await fetchCloudflareCredentials(tokenId, apiToken);

    // 3. Cloudflare returns: { iceServers: [...] }
    // BUT we must verify it's actually there to avoid the .map error in frontend
    if (cfResponse && Array.isArray(cfResponse.iceServers)) {
      console.log('[TURN] Cloudflare credentials fetched successfully');
      return res.json({
        success: true,
        iceServers: cfResponse.iceServers,
      });
    }

    throw new Error('Cloudflare response did not contain iceServers array');
  } catch (err) {
    console.error('[TURN] Failed to fetch Cloudflare credentials:', err.message);
    
    // 4. Graceful Fallback (STUN only)
    return res.json({
      success: true,
      iceServers: [
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.l.google.com:19302' },
      ],
      debug: {
        fallback: true,
        error: err.message
      }
    });
  }
}

/**
 * Post request to Cloudflare TURN credentials endpoint
 */
function fetchCloudflareCredentials(tokenId, apiToken) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ ttl: 86400 });

    const options = {
      hostname: 'rtc.live.cloudflare.com',
      // Cloudflare standard endpoint
      path:     `/v1/turn/keys/${tokenId}/credentials/generate`, 
      method:   'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          if (response.statusCode >= 400) {
            return reject(new Error(`Cloudflare status ${response.statusCode}: ${data}`));
          }
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse Cloudflare response'));
        }
      });
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

router.get('/credentials', getTurnCredentials);

module.exports = router;