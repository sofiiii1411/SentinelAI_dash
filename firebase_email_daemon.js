const nodemailer = require('nodemailer');
const https = require('https');

const FIREBASE_DB_URL = "https://sentinelaidashboard-default-rtdb.firebaseio.com";
const GMAIL_USER = "sofiiii.1411@gmail.com";
const GMAIL_APP_PASS = "sbijkfkjzijczqsn";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS
  }
});

const lastSentOtps = new Map();
const lastRequestIds = new Map();

const fs = require('fs');
const path = require('path');

async function sendMagicLinkEmail(toEmail, resetToken) {
  const resetUrl = `https://sentinelai-x.netlify.app/reset-password?token=${resetToken}`;

  try {
    const logoCandidates = [
      path.join(__dirname, 'assets/sentinelai-profile-logo.png'),
      path.join(__dirname, 'sentinelai-profile-logo.png')
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

    const info = await transporter.sendMail({
      from: `"SentinelAI-X Security" <${GMAIL_USER}>`,
      to: toEmail,
      subject: "SentinelAI-X | Password Reset",
      text: `SentinelAI-X Password Reset\n\nWe received a request to reset the password for your SentinelAI-X account.\n\nClick the link below to securely create a new password:\n${resetUrl}\n\nThis secure reset link is valid for 10 minutes and can be used only once.\n\nFor your security, do not share this reset link with anyone. If you did not request a password reset, please disregard this email.\n\n— SentinelAI-X Security System`,
      html: `
<!DOCTYPE html>
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
      <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 34px; border-radius: 12px; box-shadow: 0 6px 18px rgba(124, 58, 237, 0.35); letter-spacing: 0.5px;">
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
</html>
      `,
      attachments: attachments
    });
    console.log(`🚀 [SENT PASSWORD RESET LINK] Email sent to ${toEmail} | MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ [ERROR] Failed to send Password Reset Link to ${toEmail}:`, err.message);
    return false;
  }
}

async function checkFirebaseRequests() {
  https.get(`${FIREBASE_DB_URL}/passwordResetRequests.json`, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', async () => {
      try {
        if (!body || body === 'null') return;
        const requests = JSON.parse(body);
        for (const [key, req] of Object.entries(requests)) {
          if (!req || !req.email || !req.otp || req.used) continue;
          
          const email = req.email.toLowerCase().trim();
          const currentOtp = String(req.otp).trim();
          const resetToken = String(req.resetToken || ("SENTINEL-MAGIC-" + Date.now()));
          const reqId = String(req.requestId || req.createdAt || currentOtp);
          
          const prevOtp = lastSentOtps.get(email);
          const prevReqId = lastRequestIds.get(email);

          if (currentOtp !== prevOtp || reqId !== prevReqId) {
            lastSentOtps.set(email, currentOtp);
            lastRequestIds.set(email, reqId);
            console.log(`📩 [RESET LINK TRIGGER] Detected request for ${email} (Token: ${resetToken})`);
            await sendMagicLinkEmail(email, resetToken);
          }
        }
      } catch (err) {}
    });
  }).on('error', () => {});
}

console.log("==========================================================");
console.log("🛡️ SentinelAI-X Magic Password Reset Link Dispatcher Active");
console.log(`Sender: ${GMAIL_USER}`);
console.log("Monitoring Firebase Realtime Database in real-time...");
console.log("==========================================================");

setInterval(checkFirebaseRequests, 1000);
checkFirebaseRequests();
