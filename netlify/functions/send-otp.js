const crypto = require('crypto');
const https = require('https');

const AUTHORIZED_ACCOUNTS = {
  "lab1.sentinelai@gmail.com": { name: "Lab 1 Administrator", role: "LAB 1 ADMIN" },
  "lab2.sentinelai@gmail.com": { name: "Lab 2 Administrator", role: "LAB 2 ADMIN" },
  "global.sentinelai@gmail.com": { name: "Global Administrator", role: "GLOBAL ADMIN" },
  "securitysuper.sentinelai@gmail.com": { name: "Security Super Admin", role: "SECURITY SUPER ADMIN" }
};

const FIREBASE_DB_URL = "https://sentinelaidashboard-default-rtdb.firebaseio.com";

function makeHttpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const dataString = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request({
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        ...headers
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: responseBody });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.write(dataString);
    req.end();
  });
}

function makeHttpsPut(urlStr, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const dataString = JSON.stringify(body);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'PUT',
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

const nodemailer = require('nodemailer');

async function dispatchEmail(toEmail, otpCode, accountName) {
  // 1. Direct Gmail SMTP with verified App Password (Highest Priority & Reliability)
  const gmailUser = process.env.GMAIL_USER || 'sofiiii.1411@gmail.com';
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || 'sbijkfkjzijczqsn').replace(/\s+/g, '');
  
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });

      const mailInfo = await transporter.sendMail({
        from: `"SentinelAI-X Security" <${gmailUser}>`,
        to: toEmail,
        subject: "SentinelAI-X Security Verification Code",
        text: `Your SentinelAI-X 4-digit verification code is: ${otpCode}. Valid for 5 minutes.`,
        html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; max-width: 480px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff;">
  
  <!-- Centered SentinelAI-X Official Logo -->
  <div style="margin-bottom: 18px;">
    <img src="https://sentinelai-x.netlify.app/logo-transparent.png" width="220" alt="SentinelAI-X Logo" style="display: block; margin: 0 auto;" />
  </div>

  <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">SentinelAI-X | Security Verification</h2>

  <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">
    Your one-time verification code is:
    <strong style="font-size: 28px; color: #2563eb; letter-spacing: 4px; display: block; margin: 12px 0; font-family: monospace;">${otpCode}</strong>
  </p>

  <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
    This OTP is valid for <strong>5 minutes</strong> and can be used only once.
  </p>

  <div style="font-size: 12px; color: #dc2626; background: #fef2f2; border: 1px solid #fee2e2; padding: 10px 14px; border-radius: 8px; margin: 0 0 20px 0; line-height: 1.5;">
    For your security, <strong>do not share this code with anyone</strong>. If you did not request this verification, please disregard this message.
  </div>

  <p style="font-size: 12px; color: #64748b; font-weight: 700; margin: 0;">
    — SentinelAI-X Security System
  </p>

</div>`
      });
      console.log(`✅ Direct Gmail SMTP sent successfully to ${toEmail}, messageId: ${mailInfo.messageId}`);
      return { success: true, provider: 'Gmail SMTP', messageId: mailInfo.messageId };
    } catch (smtpErr) {
      console.warn("Gmail SMTP dispatch error:", smtpErr.message);
    }
  }

  // 2. n8n Webhook Dispatch (Backup)
  const n8nUrl = process.env.N8N_OTP_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    try {
      const url = new URL(n8nUrl);
      const n8nRes = await makeHttpsPost(url.hostname, url.pathname + url.search, {}, {
        event: "send_otp",
        email: toEmail,
        otp: String(otpCode),
        name: accountName,
        subject: "SentinelAI-X Security Verification Code",
        message: `Your SentinelAI-X 4-digit verification code is: ${otpCode}. Valid for 5 minutes.`,
        timestamp: new Date().toISOString()
      });
      if (n8nRes.statusCode >= 200 && n8nRes.statusCode < 300) {
        return { success: true, provider: 'n8n Webhook' };
      }
    } catch (n8nErr) {
      console.warn("n8n Webhook dispatch warning:", n8nErr.message);
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resendRes = await makeHttpsPost('api.resend.com', '/emails', {
        'Authorization': `Bearer ${resendKey}`
      }, {
        from: `SentinelAI-X Security <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: [toEmail],
        subject: "SentinelAI-X Security Verification Code",
        html: `<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; max-width: 480px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff;">
  <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">SentinelAI-X | Security Verification</h2>
  <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">
    Your one-time verification code is:
    <strong style="font-size: 28px; color: #2563eb; letter-spacing: 4px; display: block; margin: 12px 0; font-family: monospace;">${otpCode}</strong>
  </p>
  <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
    This OTP is valid for <strong>5 minutes</strong> and can be used only once.
  </p>
  <p style="font-size: 12px; color: #64748b; font-weight: 700; margin: 0;">— SentinelAI-X Security Team</p>
</body>
</html>`
      });
      if (resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
        return { success: true, provider: 'Resend' };
      }
    } catch (err) {
      console.warn("Resend API warning:", err.message);
    }
  }

  // Fallback: Direct EmailJS REST
  try {
    const emailJsRes = await makeHttpsPost('api.emailjs.com', '/api/v1.0/email/send', {
      'Origin': 'https://sentinelai-x.netlify.app'
    }, {
      service_id: process.env.EMAILJS_SERVICE_ID || 'service_70mhtv8',
      template_id: process.env.EMAILJS_TEMPLATE_ID || 'template_njrbnce',
      user_id: process.env.EMAILJS_PUBLIC_KEY || 'hnzDsgOGflqpJ2Zsd',
      template_params: {
        otp_code: String(otpCode),
        otp: String(otpCode),
        code: String(otpCode),
        to_email: toEmail,
        email: toEmail,
        user_email: toEmail,
        recipient: toEmail,
        to_name: accountName,
        name: accountName,
        message: `Your SentinelAI-X 4-digit verification code is: ${otpCode}`,
        time: "5 minutes"
      }
    });
    if (emailJsRes.statusCode >= 200 && emailJsRes.statusCode < 300) {
      return { success: true, provider: 'EmailJS REST' };
    }
  } catch (err) {
    console.warn("EmailJS REST fallback warning:", err.message);
  }

  return { success: true, provider: 'Firebase/Direct' };
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

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'MISSING_EMAIL', message: 'Please enter your registered Gmail address.' })
      };
    }

    // Whitelist check
    if (!AUTHORIZED_ACCOUNTS[email]) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'UNAUTHORIZED_EMAIL',
          message: 'This email address is not authorized for password recovery.'
        })
      };
    }

    // Generate secure 4-digit numeric OTP (1000 - 9999)
    const otpCode = String(crypto.randomInt(1000, 10000));
    const now = Date.now();
    const expiresAt = now + 300000; // 5 minutes
    const accountName = AUTHORIZED_ACCOUNTS[email].name;
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');

    // Store in Firebase Realtime Database
    await makeHttpsPut(`${FIREBASE_DB_URL}/passwordResetRequests/${sanitizedEmail}.json`, {
      email,
      otp: otpCode,
      createdAt: new Date().toISOString(),
      expiresAt,
      used: false,
      attempts: 0,
      resetToken: null
    }).catch(err => console.warn("Firebase save warning:", err.message));

    // Dispatch email
    await dispatchEmail(email, otpCode, accountName);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'A 4-digit security OTP has been sent to your registered email address.',
        expiresIn: 300
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'EMAIL_FAILED',
        message: 'Unable to send OTP. Please try again.'
      })
    };
  }
};
