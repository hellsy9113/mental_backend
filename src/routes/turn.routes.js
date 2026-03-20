/**
 * src/routes/turn.routes.js
 *
 * Fetches short-lived TURN credentials from Cloudflare Calls TURN REST API.
 *
 * Cloudflare TURN uses a REST endpoint — NOT HMAC-SHA1.
 * You hit their API with your API Token as a Bearer token,
 * and they return temporary username + credential valid for `ttl` seconds.
 *
 * Cloudflare API reference:
 *   POST https://rtc.live.cloudflare.com/v1/turn/keys/{KEY_ID}/credentials/generate
 *   Authorization: Bearer {API_TOKEN}
 *   Body: { "ttl": 86400 }
 *
 * ENV vars needed (add to your .env):
 *   CLOUDFLARE_TURN_KEY_ID    – The "API Token ID" shown in Cloudflare dashboard
 *   CLOUDFLARE_TURN_API_TOKEN – The "API Token" (secret) shown in Cloudflare dashboard
 *
 * Cloudflare TURN server URLs (fixed, no config needed):
 *   stun:stun.cloudflare.com:3478
 *   turn:turn.cloudflare.com:3478          (UDP)
 *   turn:turn.cloudflare.com:3478?transport=tcp
 *   turns:turn.cloudflare.com:5349?transport=tcp  (TLS)
 */

const express = require('express');
const https   = require('https');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// ── Helper: call Cloudflare TURN REST API ─────────────────────────
function fetchCloudflareCredentials(keyId, apiToken, ttl = 86400) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ ttl });

    const options = {
      hostname: 'rtc.live.cloudflare.com',
      path:     `/v1/turn/keys/${keyId}/credentials/generate`,
      method:   'POST',
      headers: {
        'Authorization':  `Bearer ${apiToken}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 201 && res.statusCode !== 200) {
          return reject(new Error(
            `Cloudflare TURN API returned ${res.statusCode}: ${data}`
          ));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse Cloudflare TURN response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── GET /api/turn/credentials ─────────────────────────────────────
// Both students and counsellors join calls → any authenticated role allowed
router.get('/credentials', verifyToken, async (req, res) => {
  const KEY_ID    = process.env.CLOUDFLARE_TURN_KEY_ID;
  const API_TOKEN = process.env.CLOUDFLARE_TURN_API_TOKEN;

  // ── Dev fallback: return STUN only when not configured ───────
  if (!KEY_ID || !API_TOKEN) {
    console.warn('[TURN] Cloudflare env vars missing — returning STUN only');
    return res.json({
      success: true,
      data: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        ttl: 86400,
      },
    });
  }

  try {
    const TTL   = 86400; // 24 h — Cloudflare max on free tier
    const cfRes = await fetchCloudflareCredentials(KEY_ID, API_TOKEN, TTL);

    // Cloudflare response shape:
    // {
    //   "iceServers": {
    //     "urls": [
    //       "stun:stun.cloudflare.com:3478",
    //       "turn:turn.cloudflare.com:3478",
    //       "turn:turn.cloudflare.com:3478?transport=tcp",
    //       "turns:turn.cloudflare.com:5349?transport=tcp"
    //     ],
    //     "username": "<temp-username>",
    //     "credential": "<temp-password>"
    //   }
    // }
    const { iceServers } = cfRes;

    return res.json({
      success: true,
      data: {
        // Standard RTCConfiguration.iceServers array:
        // Google STUN first as ultra-cheap fallback, then Cloudflare TURN
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls:       Array.isArray(iceServers.urls)
                          ? iceServers.urls
                          : [iceServers.urls],
            username:   iceServers.username,
            credential: iceServers.credential,
          },
        ],
        ttl: TTL,
      },
    });

  } catch (err) {
    console.error('[TURN] Cloudflare credential fetch failed:', err.message);

    // Graceful degradation — calls still work on same-network peers
    return res.status(200).json({
      success: true,
      warning: 'TURN unavailable, falling back to STUN only',
      data: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        ttl: 86400,
      },
    });
  }
});

module.exports = router;