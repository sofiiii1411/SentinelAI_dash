const crypto = require('crypto');
const https = require('https');
const nodemailer = require('nodemailer');

const AUTHORIZED_ACCOUNTS = {
  "lab1.sentinelai@gmail.com": { name: "Lab 1 Administrator", role: "LAB 1 ADMIN" },
  "lab2.sentinelai@gmail.com": { name: "Lab 2 Administrator", role: "LAB 2 ADMIN" },
  "global.sentinelai@gmail.com": { name: "Global Administrator", role: "GLOBAL ADMIN" },
  "securitysuper.sentinelai@gmail.com": { name: "Security Super Admin", role: "SECURITY SUPER ADMIN" }
};

const FIREBASE_DB_URL = "https://sentinelaidashboard-default-rtdb.firebaseio.com";

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

const path = require('path');
const fs = require('fs');

function getEmailHtml(resetLink) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 28px 12px; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
  <div style="text-align: center; max-width: 480px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 24px; background: #ffffff; box-shadow: 0 12px 30px rgba(0,0,0,0.06);">
    
    <!-- SentinelAI-X Official Hexagon Profile Logo -->
    <div style="margin-bottom: 20px;">
      <img src="cid:profile_logo" width="105" height="105" alt="SentinelAI-X Logo" style="display: block; margin: 0 auto; width: 105px; height: 105px; object-fit: contain; border-radius: 22px; filter: drop-shadow(0 6px 16px rgba(0, 112, 243, 0.25));" onerror="this.src='https://sentinelai-x.netlify.app/assets/sentinelai-profile-logo.png'" />
    </div>

    <h2 style="color: #0f172a; font-size: 21px; font-weight: 800; margin: 0 0 14px 0; letter-spacing: -0.02em;">SentinelAI-X | Password Reset</h2>

    <p style="font-size: 15px; color: #334155; line-height: 1.55; margin: 0 0 12px 0;">
      We received a request to reset the password for your SentinelAI-X account.
    </p>

    <p style="font-size: 14px; color: #475569; margin: 0 0 22px 0;">
      Click the button below to securely create a new password.
    </p>

    <!-- Prominent Reset Password Button -->
    <div style="margin: 26px 0;">
      <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 34px; border-radius: 12px; box-shadow: 0 6px 18px rgba(124, 58, 237, 0.35); letter-spacing: 0.5px;">
        RESET PASSWORD
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
      This secure reset link is valid for <strong>10 minutes</strong> and can be used only once.
    </p>

    <div style="font-size: 12px; color: #dc2626; background: #fef2f2; border: 1px solid #fee2e2; padding: 12px 16px; border-radius: 10px; margin: 0 0 22px 0; line-height: 1.5; text-align: left;">
      🔒 <strong>Security Notice:</strong> For your security, do not share this reset link with anyone. If you did not request a password reset, please disregard this email.
    </div>

    <p style="font-size: 12px; color: #64748b; font-weight: 700; margin: 0;">
      — SentinelAI-X Security System
    </p>

  </div>
</body>
</html>`;
}

async function sendResetEmail(toEmail, resetLink) {
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

      // Prepare profile image attachment
      const logoCandidates = [
        path.join(__dirname, '../../assets/sentinelai-profile-logo.png'),
        path.join(__dirname, '../assets/sentinelai-profile-logo.png'),
        path.join(process.cwd(), 'assets/sentinelai-profile-logo.png'),
        path.join(process.cwd(), 'sentinelai-profile-logo.png')
      ];
      let logoBuffer = null;
      for (const p of logoCandidates) {
        if (fs.existsSync(p)) {
          logoBuffer = fs.readFileSync(p);
          break;
        }
      }

      const attachments = [];
      if (logoBuffer) {
        attachments.push({
          filename: 'sentinelai-profile-logo.png',
          content: logoBuffer,
          cid: 'profile_logo'
        });
      }

      const mailInfo = await transporter.sendMail({
        from: `"SentinelAI-X Security" <${gmailUser}>`,
        to: toEmail,
        subject: "SentinelAI-X | Password Reset",
        text: `SentinelAI-X Password Reset\n\nWe received a request to reset your password.\nClick the link below to securely create a new password:\n${resetLink}\n\nThis link is valid for 10 minutes and can be used only once.\n\n— SentinelAI-X Security System`,
        html: getEmailHtml(resetLink),
        attachments: attachments
      });
      console.log(`✅ Reset email dispatched to ${toEmail} | MessageId: ${mailInfo.messageId}`);
      return { success: true, messageId: mailInfo.messageId };
    } catch (err) {
      console.error("Gmail SMTP error:", err.message);
    }
  }
  return { success: false, error: "SMTP_FAILED" };
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
    const email = (data.email || '').trim().toLowerCase();

    // Generic safe response to prevent email enumeration
    const genericResponse = {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'If an account exists for this email address, a password reset link has been sent.',
        expiresIn: 600
      })
    };

    if (!email || !AUTHORIZED_ACCOUNTS[email]) {
      return genericResponse;
    }

    // Generate cryptographic token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const now = Date.now();
    const expiresAt = now + 600000; // 10 minutes
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');

    // Reset Link URL
    const headersObj = event.headers || {};
    const host = headersObj.host || headersObj.Host || 'sentinelai-x.netlify.app';
    const proto = (headersObj['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https'));
    const resetUrl = `${proto}://${host}/reset-password?token=${rawToken}`;

    // Store in Firebase Realtime Database
    await makeHttpsPut(`${FIREBASE_DB_URL}/passwordResetTokens/${rawToken}.json`, {
      email,
      tokenHash,
      createdAt: new Date().toISOString(),
      expiresAt,
      used: false
    });

    // Also update legacy request key for backwards compatibility
    await makeHttpsPut(`${FIREBASE_DB_URL}/passwordResetRequests/${sanitizedEmail}.json`, {
      email,
      resetToken: rawToken,
      createdAt: new Date().toISOString(),
      expiresAt,
      used: false,
      requestId: `req_${now}`
    });

    // Dispatch real email via Google SMTP
    await sendResetEmail(email, resetUrl);

    return genericResponse;
  } catch (err) {
    console.error("request-password-reset error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'SERVER_ERROR', message: 'Unable to process password reset request.' })
    };
  }
};
