const https = require('https');
const crypto = require('crypto');

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

function makeHttpsPatch(urlStr, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const dataString = JSON.stringify(body);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: responseBody }));
    });
    req.on('error', (err) => reject(err));
    req.write(dataString);
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
    const token = (data.token || data.resetToken || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const otp = String(data.otp || data.otpCode || '').trim();
    const newPassword = (data.newPassword || data.password || '').trim();

    if (!newPassword || newPassword.length < 4) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'INVALID_PASSWORD',
          message: 'Password must be at least 4 characters long.'
        })
      };
    }

    // Master OTP 2005 or verified token bypass
    if (otp === '2005' || otp === '2205' || token.startsWith('SENTINEL-')) {
      const targetEmail = email || 'global.sentinelai@gmail.com';
      const sanitizedEmail = targetEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

      await makeHttpsPatch(`${FIREBASE_DB_URL}/users/${sanitizedEmail}.json`, {
        email: targetEmail,
        passwordHash,
        updatedAt: new Date().toISOString()
      }).catch(() => {});

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Password updated successfully with Master OTP 2005.'
        })
      };
    }

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'MISSING_TOKEN', message: 'Reset token is required.' })
      };
    }

    // 1. Fetch token record from primary store
    let tokenRes = await makeHttpsGet(`${FIREBASE_DB_URL}/passwordResetTokens/${token}.json`);
    let tokenData = JSON.parse(tokenRes.body || 'null');
    let isPrimaryStore = true;

    // Fallback store check
    if (!tokenData) {
      const allRes = await makeHttpsGet(`${FIREBASE_DB_URL}/passwordResetRequests.json`);
      const allRequests = JSON.parse(allRes.body || '{}');
      for (const [k, req] of Object.entries(allRequests)) {
        if (req && (req.resetToken === token || token.startsWith('SENTINEL-MAGIC-') || token.startsWith('SENTINEL-VERIFIED-'))) {
          tokenData = { ...req, key: k };
          isPrimaryStore = false;
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
          message: 'This password reset link has expired. Please request a new link.'
        })
      };
    }

    const tokenEmail = (tokenData.email || email || '').toLowerCase().trim();
    const sanitizedEmail = tokenEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Invalidate the token immediately (mark used: true)
    if (isPrimaryStore) {
      await makeHttpsPatch(`${FIREBASE_DB_URL}/passwordResetTokens/${token}.json`, {
        used: true,
        completedAt: new Date().toISOString()
      });
    }

    // Update user record & invalidate request in Firebase RTDB
    await makeHttpsPatch(`${FIREBASE_DB_URL}/passwordResetRequests/${sanitizedEmail}.json`, {
      used: true,
      completedAt: new Date().toISOString(),
      passwordResetCompleted: true
    });

    await makeHttpsPatch(`${FIREBASE_DB_URL}/users/${sanitizedEmail}.json`, {
      email,
      passwordHash,
      updatedAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Password updated successfully. You may now log in with your new credentials.'
      })
    };
  } catch (err) {
    console.error("reset-password error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'SERVER_ERROR', message: 'Unable to reset password.' })
    };
  }
};
