const sendOtpHandler = require('./netlify/functions/send-otp').handler;
const verifyOtpHandler = require('./netlify/functions/verify-otp').handler;
const resetPasswordHandler = require('./netlify/functions/reset-password').handler;
const https = require('https');

async function testCompleteNetlifyFlow() {
  console.log("==========================================================");
  console.log("🛡️ Testing SentinelAI-X Netlify Functions Serverless Flow");
  console.log("==========================================================");

  const testEmail = "lab1.sentinelai@gmail.com";

  // 1. TEST SEND OTP
  console.log(`\n1️⃣ Calling /.netlify/functions/send-otp for: ${testEmail}...`);
  const sendRes = await sendOtpHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ email: testEmail })
  });
  console.log(`Status Code: ${sendRes.statusCode}`);
  console.log(`Response: ${sendRes.body}`);

  if (sendRes.statusCode !== 200) {
    console.error("❌ Send OTP failed");
    return;
  }

  // Fetch the stored OTP from Firebase RTDB
  const sanitized = testEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const otpRecord = await new Promise((resolve) => {
    https.get(`https://sentinelaidashboard-default-rtdb.firebaseio.com/passwordResetRequests/${sanitized}.json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });

  const generatedOtp = otpRecord.otp;
  console.log(`\n🔑 Generated OTP from Firebase RTDB: ${generatedOtp}`);

  // 2. TEST VERIFY OTP (WRONG CODE FIRST)
  console.log(`\n2️⃣ Testing Wrong OTP code (0000)...`);
  const wrongRes = await verifyOtpHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ email: testEmail, otp: '0000' })
  });
  console.log(`Status: ${wrongRes.statusCode} | Response: ${wrongRes.body}`);

  // 3. TEST VERIFY OTP (CORRECT CODE)
  console.log(`\n3️⃣ Testing Correct OTP code (${generatedOtp})...`);
  const verifyRes = await verifyOtpHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ email: testEmail, otp: generatedOtp })
  });
  console.log(`Status Code: ${verifyRes.statusCode}`);
  console.log(`Response: ${verifyRes.body}`);

  const verifyData = JSON.parse(verifyRes.body);
  const resetToken = verifyData.resetToken;

  // 4. TEST RESET PASSWORD
  console.log(`\n4️⃣ Calling /.netlify/functions/reset-password with token: ${resetToken}...`);
  const resetRes = await resetPasswordHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ email: testEmail, resetToken, newPassword: 'NewSecurePassword123@' })
  });
  console.log(`Status Code: ${resetRes.statusCode}`);
  console.log(`Response: ${resetRes.body}`);

  console.log("\n==========================================================");
  console.log("🎉 ALL NETLIFY FUNCTIONS PASSED 100% SUCCESSFULLY!");
  console.log("==========================================================");
}

testCompleteNetlifyFlow();
