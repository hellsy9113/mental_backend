/**
 * src/controller/turn.controller.js
 *
 * Fetches short-lived TURN credentials from Cloudflare Calls API.
 * Cloudflare docs: https://developers.cloudflare.com/calls/turn/
 *
 * Required env vars:
 *   CF_TURN_TOKEN_ID   — your Cloudflare TURN token ID
 *   CF_TURN_API_TOKEN  — your Cloudflare TURN API token
 */

const https = require('https');

async function getTurnCredentials(req, res) {
  const tokenId  = process.env.CF_TURN_TOKEN_ID;
  const apiToken = process.env.CF_TURN_API_TOKEN;

  if (!tokenId || !apiToken) {
    // Fallback: return only STUN so the app still works without TURN configured
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
    // Call Cloudflare Calls TURN REST API
    const cfResponse = await fetchCloudflareCredentials(tokenId, apiToken);

    // Cloudflare returns: { iceServers: [...] }
    return res.json({
      success: true,
      iceServers: cfResponse.iceServers,
    });
  } catch (err) {
    console.error('[TURN] Failed to fetch Cloudflare credentials:', err.message);
    // Graceful fallback — call still works over relay-less STUN
    return res.json({
      success: true,
      iceServers: [
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
  }
}

/**
 * POST https://rtc.live.cloudflare.com/v1/turn/keys/{tokenId}/credentials/generate
 * Body: { ttl: 86400 }  — 24 h is the max; use shorter for production
 */
function fetchCloudflareCredentials(tokenId, apiToken) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ ttl: 86400 });

    const options = {
      hostname: 'rtc.live.cloudflare.com',
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
          if (response.statusCode !== 200 && response.statusCode !== 201) {
            return reject(new Error(`Cloudflare returned ${response.statusCode}: ${data}`));
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

module.exports = { getTurnCredentials };