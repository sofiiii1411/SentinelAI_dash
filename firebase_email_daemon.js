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

async function sendMagicLinkEmail(toEmail, resetToken) {
  const resetUrl = `https://sentinelai-x.netlify.app/reset-password?token=${resetToken}`;

  try {
    const info = await transporter.sendMail({
      from: `"SentinelAI-X Security" <${GMAIL_USER}>`,
      to: toEmail,
      subject: "SentinelAI-X | Password Reset",
      text: `SentinelAI-X Password Reset\n\nWe received a request to reset the password for your SentinelAI-X account.\n\nClick the link below to securely create a new password:\n${resetUrl}\n\nThis secure reset link is valid for 10 minutes and can be used only once.\n\nFor your security, do not share this reset link with anyone. If you did not request a password reset, please disregard this email.\n\n— SentinelAI-X Security System`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 24px 10px; background-color: #f8fafc;">
  <div style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; max-width: 480px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff;">
    
    <!-- Centered SentinelAI-X Official Logo -->
    <div style="margin-bottom: 18px;">
      <img src="https://sentinelai-x.netlify.app/logo-transparent.png" width="220" alt="SentinelAI-X Logo" style="display: block; margin: 0 auto;" />
    </div>

    <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">SentinelAI-X | Password Reset</h2>

    <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">
      We received a request to reset the password for your SentinelAI-X account.
    </p>

    <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">
      Click the button below to securely create a new password.
    </p>

    <!-- Prominent Reset Password Button -->
    <div style="margin: 24px 0;">
      <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3); letter-spacing: 0.5px;">
        RESET PASSWORD
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
      This secure reset link is valid for <strong>10 minutes</strong> and can be used only once.
    </p>

    <div style="font-size: 12px; color: #dc2626; background: #fef2f2; border: 1px solid #fee2e2; padding: 10px 14px; border-radius: 8px; margin: 0 0 20px 0; line-height: 1.5; text-align: left;">
      For your security, do not share this reset link with anyone. If you did not request a password reset, please disregard this email.
    </div>

    <p style="font-size: 12px; color: #64748b; font-weight: 700; margin: 0;">
      — SentinelAI-X Security System
    </p>

  </div>
</body>
</html>
      `
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
