const https = require('https');

const ACCOUNTS = [
  { email: 'securitysuper.sentinelai@gmail.com', name: 'Security Super Admin', role: 'SECURITY SUPER ADMIN' },
  { email: 'global.sentinelai@gmail.com', name: 'Global Administrator', role: 'GLOBAL ADMIN' },
  { email: 'lab1.sentinelai@gmail.com', name: 'Lab 1 Administrator', role: 'LAB 1 ADMIN' },
  { email: 'lab2.sentinelai@gmail.com', name: 'Lab 2 Administrator', role: 'LAB 2 ADMIN' }
];

const SERVICE_ID = 'service_70mhtv8';
const TEMPLATE_ID = 'template_njrbnce';
const PUBLIC_KEY = 'hnzDsgOGflqpJ2Zsd';

function sendOtpForAccount(account) {
  return new Promise((resolve, reject) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const payload = JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        otp_code: otp,
        to_email: account.email,
        reply_to: account.email,
        to_name: account.name,
        name: account.name,
        email: account.email,
        message: `Your SentinelAI-X 4-Digit Security OTP is: ${otp}. Valid for 5 minutes.`,
        time: new Date().toLocaleTimeString()
      }
    });

    const options = {
      hostname: 'api.emailjs.com',
      port: 443,
      path: '/api/v1.0/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Origin': 'https://sentinelai-x.netlify.app'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, email: account.email, otp, status: res.statusCode, body });
        } else {
          resolve({ success: false, email: account.email, status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, email: account.email, error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function testAll() {
  console.log('====================================================');
  console.log('🛡️ SentinelAI-X: Dispatching Test OTPs to all 4 Members');
  console.log('====================================================');

  for (const acc of ACCOUNTS) {
    process.stdout.write(`⏳ Sending to ${acc.email} (${acc.name})... `);
    const result = await sendOtpForAccount(acc);
    if (result.success) {
      console.log(`✅ [HTTP ${result.status}] Dispatched OTP: ${result.otp}`);
    } else {
      console.log(`❌ [HTTP ${result.status}] Error: ${result.body || result.error}`);
    }
  }
  console.log('====================================================');
}

testAll();
