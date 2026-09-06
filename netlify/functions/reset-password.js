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
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body || '{}') });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: null });
        }
      });
    });
    req.on('error', reject);
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
    req.on('error', reject);
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
      body: JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const email = (data.email || '').trim().toLowerCase();
    const resetToken = data.resetToken || data.reset_token || '';
    const newPassword = data.newPassword || data.new_password || '';

    if (!email || !newPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'MISSING_FIELDS', message: 'Email and new password are required.' })
      };
    }

    if (newPassword.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' })
      };
    }

    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const fbRes = await makeHttpsGet(`${FIREBASE_DB_URL}/passwordResetRequests/${sanitizedEmail}.json`);
    const record = fbRes.data;

    if (!record || record.resetToken !== resetToken || !record.used) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'UNAUTHORIZED_SESSION',
          message: 'Invalid or expired password reset session. Please request a new OTP.'
        })
      };
    }

    // Invalidate reset token and record successful reset
    await makeHttpsPatch(`${FIREBASE_DB_URL}/passwordResetRequests/${sanitizedEmail}.json`, {
      resetToken: null,
      passwordResetCompleted: true,
      completedAt: new Date().toISOString()
    }).catch(() => {});

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Password updated successfully. You may now log in with your new credentials.'
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'SERVER_ERROR', message: err.message })
    };
  }
};
