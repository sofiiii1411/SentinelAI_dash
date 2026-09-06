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

async function sendMagicLinkEmail(toEmail, otpCode, resetToken) {
  const accountNames = {
    "lab1.sentinelai@gmail.com": "Lab 1 Administrator",
    "lab2.sentinelai@gmail.com": "Lab 2 Administrator",
    "global.sentinelai@gmail.com": "Global Administrator",
    "securitysuper.sentinelai@gmail.com": "Security Super Admin"
  };
  const name = accountNames[toEmail] || "SentinelAI-X User";
  
  const magicLink = `https://sentinelai-x.netlify.app/login.html?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  try {
    const info = await transporter.sendMail({
      from: `"SentinelAI-X Security" <${GMAIL_USER}>`,
      to: toEmail,
      subject: "SentinelAI-X | Secure Password Reset Link",
      text: `Hello ${name},\n\nWe received a request to reset your password for SentinelAI-X.\n\nClick the link below to set a new password:\n${magicLink}\n\nOr use this 4-digit security code: ${otpCode}\n\nThis link is valid for 10 minutes.\n— SentinelAI-X Security System`,
      html: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; text-align: center; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 20px; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
  
  <!-- Centered SentinelAI-X Official Logo -->
  <div style="margin-bottom: 24px;">
    <img src="https://sentinelai-x.netlify.app/logo-transparent.png" width="220" alt="SentinelAI-X Logo" style="display: block; margin: 0 auto;" />
  </div>

  <div style="display: inline-block; padding: 4px 14px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #7c3aed; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
    Security Authorization
  </div>

  <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">Reset Your Password</h2>

  <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
    Hello <strong>${name}</strong>,<br/>
    We received a password reset request for your <strong>SentinelAI-X</strong> account. Click the button below to set a new password.
  </p>

  <!-- 1-Click Magic Button -->
  <div style="margin: 28px 0;">
    <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 36px; border-radius: 12px; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35); letter-spacing: 0.5px;">
      Reset Password Now →
    </a>
  </div>

  <p style="font-size: 13px; color: #64748b; margin: 20px 0 8px 0;">
    Alternatively, enter your 4-digit security code:
  </p>
  <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px 20px; border-radius: 8px; display: inline-block; font-size: 24px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">
    ${otpCode}
  </div>

  <div style="font-size: 12px; color: #dc2626; background: #fef2f2; border: 1px solid #fee2e2; padding: 12px 16px; border-radius: 10px; margin: 24px 0; line-height: 1.5; text-align: left;">
    🔒 <strong>Security Notice:</strong> This reset link is single-use and will expire in <strong>10 minutes</strong>. If you did not request this, please disregard this email.
  </div>

  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

  <p style="font-size: 12px; color: #94a3b8; margin: 0;">
    SentinelAI-X Enterprise Security Node • Automated Verification
  </p>
</div>
      `
    });
    console.log(`🚀 [SENT MAGIC LINK] Email sent to ${toEmail} | MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ [ERROR] Failed to send Magic Link to ${toEmail}:`, err.message);
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
            console.log(`📩 [MAGIC LINK TRIGGER] Detected request for ${email} (Token: ${resetToken})`);
            await sendMagicLinkEmail(email, currentOtp, resetToken);
          }
        }
      } catch (err) {}
    });
  }).on('error', () => {});
}

console.log("==========================================================");
console.log("🛡️ SentinelAI-X 1-Click Magic Link & OTP Dispatcher Active");
console.log(`Sender: ${GMAIL_USER}`);
console.log("Monitoring Firebase Realtime Database in real-time...");
console.log("==========================================================");

setInterval(checkFirebaseRequests, 1000);
checkFirebaseRequests();
