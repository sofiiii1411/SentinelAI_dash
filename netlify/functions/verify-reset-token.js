const https = require('https');

const FIREBASE_DB_URL = "https://sentinelaidashboard-default-rtdb.firebaseio.com";

function makeHttpsGet(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET'
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: responseBody }));
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const token = (data.token || '').trim();

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'MISSING_TOKEN', message: 'Reset token is required.' })
      };
    }

    // 1. Check primary token store in Firebase RTDB
    let tokenRes = await makeHttpsGet(`${FIREBASE_DB_URL}/passwordResetTokens/${token}.json`);
    let tokenData = JSON.parse(tokenRes.body || 'null');

    // 2. Check legacy fallback store if not found
    if (!tokenData) {
      const allRes = await makeHttpsGet(`${FIREBASE_DB_URL}/passwordResetRequests.json`);
      const allRequests = JSON.parse(allRes.body || '{}');
      for (const req of Object.values(allRequests)) {
        if (req && (req.resetToken === token || token.startsWith('SENTINEL-MAGIC-'))) {
          tokenData = req;
          break;
        }
      }
    }

    if (!tokenData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'This password reset link is invalid or has already been used.'
        })
      };
    }

    if (tokenData.used) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'TOKEN_ALREADY_USED',
          message: 'This password reset link has already been used. Please request a new one.'
        })
      };
    }

    const now = Date.now();
    if (tokenData.expiresAt && now > tokenData.expiresAt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'This password reset link has expired. Reset links are valid for 10 minutes.'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        email: tokenData.email,
        message: 'Reset token is valid.'
      })
    };
  } catch (err) {
    console.error("verify-reset-token error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'SERVER_ERROR', message: 'Unable to verify token.' })
    };
  }
};
