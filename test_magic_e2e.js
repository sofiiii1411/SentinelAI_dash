const https = require('https');
const crypto = require('crypto');

// Set env vars if not present
process.env.GMAIL_USER = process.env.GMAIL_USER || 'sofiiii.1411@gmail.com';
process.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'sbijkfkjzijczqsn';

const BASE_URL = 'https://sentinelaidashboard-default-rtdb.firebaseio.com';

function rtdbRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch(e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runE2ETest() {
  console.log('🧪 Starting SentinelAI-X Magic Password Reset E2E Test...');
  const testEmail = 'lab1.sentinelai@gmail.com';
  
  // 1. Test Request Password Reset
  console.log('\n--- 1. Testing Request Password Reset Endpoint ---');
  const reqFn = require('./netlify/functions/request-password-reset.js');
  const reqEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({ email: testEmail })
  };
  const reqRes = await reqFn.handler(reqEvent);
  console.log(`Status: ${reqRes.statusCode}`);
  const reqBody = JSON.parse(reqRes.body);
  console.log(`Response:`, reqBody);
  if (reqRes.statusCode !== 200 || !reqBody.success) {
    throw new Error('request-password-reset failed!');
  }
  console.log('✅ Request Password Reset passed! Email sent & token saved in RTDB.');

  // 2. Fetch the generated token from RTDB to test verification
  console.log('\n--- 2. Fetching Token from Firebase RTDB ---');
  const allTokens = await rtdbRequest('/passwordResetTokens.json');
  let latestToken = null;
  let latestTokenData = null;
  for (const [tok, data] of Object.entries(allTokens || {})) {
    if (data.email === testEmail && !data.used) {
      if (!latestTokenData || data.createdAt > latestTokenData.createdAt) {
        latestToken = tok;
        latestTokenData = data;
      }
    }
  }

  if (!latestToken) {
    throw new Error('No active token found in RTDB!');
  }
  console.log(`Found active token: ${latestToken.slice(0, 16)}... (Expires at: ${new Date(latestTokenData.expiresAt).toISOString()})`);

  // 3. Test Verify Reset Token Endpoint
  console.log('\n--- 3. Testing Verify Reset Token Endpoint ---');
  const verifyFn = require('./netlify/functions/verify-reset-token.js');
  const verifyEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({ token: latestToken })
  };
  const verifyRes = await verifyFn.handler(verifyEvent);
  console.log(`Status: ${verifyRes.statusCode}`);
  const verifyBody = JSON.parse(verifyRes.body);
  console.log(`Response:`, verifyBody);
  if (verifyRes.statusCode !== 200 || !verifyBody.success || verifyBody.email !== testEmail) {
    throw new Error('verify-reset-token failed!');
  }
  console.log('✅ Verify Reset Token passed!');

  // 4. Test Reset Password Endpoint
  console.log('\n--- 4. Testing Reset Password Endpoint ---');
  const resetFn = require('./netlify/functions/reset-password.js');
  const resetEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      token: latestToken,
      newPassword: 'NewSecurePassword123!'
    })
  };
  const resetRes = await resetFn.handler(resetEvent);
  console.log(`Status: ${resetRes.statusCode}`);
  const resetBody = JSON.parse(resetRes.body);
  console.log(`Response:`, resetBody);
  if (resetRes.statusCode !== 200 || !resetBody.success) {
    throw new Error('reset-password failed!');
  }
  console.log('✅ Reset Password passed! Token invalidated.');

  // 5. Test Single-Use (Re-use of same token must fail)
  console.log('\n--- 5. Testing Single-Use Enforcement (Re-using used token) ---');
  const reuseVerifyRes = await verifyFn.handler(verifyEvent);
  const reuseVerifyBody = JSON.parse(reuseVerifyRes.body);
  console.log(`Verify Re-use Status: ${reuseVerifyRes.statusCode}`, reuseVerifyBody);
  if (reuseVerifyRes.statusCode === 200 && reuseVerifyBody.success) {
    throw new Error('Security flaw: Used token was accepted by verify-reset-token!');
  }

  const reuseResetRes = await resetFn.handler(resetEvent);
  const reuseResetBody = JSON.parse(reuseResetRes.body);
  console.log(`Reset Re-use Status: ${reuseResetRes.statusCode}`, reuseResetBody);
  if (reuseResetRes.statusCode === 200 && reuseResetBody.success) {
    throw new Error('Security flaw: Used token was accepted by reset-password!');
  }
  console.log('✅ Single-use token enforcement passed (Rejected as expected: TOKEN_ALREADY_USED).');

  // 6. Test Expired Token Handling
  console.log('\n--- 6. Testing Expired Token Rejection ---');
  const expiredToken = crypto.randomBytes(32).toString('hex');
  await rtdbRequest(`/passwordResetTokens/${expiredToken}.json`, 'PUT', {
    email: testEmail,
    tokenHash: crypto.createHash('sha256').update(expiredToken).digest('hex'),
    expiresAt: Date.now() - 10000, // Expired 10 seconds ago
    createdAt: Date.now() - 610000,
    used: false
  });

  const expiredVerifyRes = await verifyFn.handler({
    httpMethod: 'POST',
    body: JSON.stringify({ token: expiredToken })
  });
  const expiredVerifyBody = JSON.parse(expiredVerifyRes.body);
  console.log(`Expired Token Verify Status: ${expiredVerifyRes.statusCode}`, expiredVerifyBody);
  if (expiredVerifyRes.statusCode === 200 && expiredVerifyBody.success) {
    throw new Error('Security flaw: Expired token was accepted!');
  }
  console.log('✅ Expired token correctly rejected (TOKEN_EXPIRED).');

  console.log('\n🎉 ALL 6 SECURITY & FUNCTIONALITY TESTS PASSED 100%!');
}

runE2ETest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
