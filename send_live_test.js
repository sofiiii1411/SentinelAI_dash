const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sofiiii.1411@gmail.com',
    pass: 'sbijkfkjzijczqsn'
  }
});

const accounts = [
  { email: 'lab1.sentinelai@gmail.com', name: 'Lab 1 Administrator' },
  { email: 'lab2.sentinelai@gmail.com', name: 'Lab 2 Administrator' },
  { email: 'global.sentinelai@gmail.com', name: 'Global Administrator' },
  { email: 'securitysuper.sentinelai@gmail.com', name: 'Security Super Admin' }
];

(async () => {
  console.log('Dispatching verification emails with EXACT custom template via Gmail SMTP...\n');
  for (const acc of accounts) {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    try {
      const info = await transporter.sendMail({
        from: '"SentinelAI-X Security" <sofiiii.1411@gmail.com>',
        to: acc.email,
        subject: 'SentinelAI-X Security Verification Code',
        text: `Your one-time verification code is: ${otp}\nThis OTP is valid for 5 minutes and can be used only once.\n— SentinelAI-X Security System`,
        html: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; max-width: 480px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff;">
  
  <!-- Centered SentinelAI-X Official Logo -->
  <div style="margin-bottom: 18px;">
    <img src="https://sentinelai-x.netlify.app/logo-transparent.png" width="220" alt="SentinelAI-X Logo" style="display: block; margin: 0 auto;" />
  </div>

  <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">SentinelAI-X | Security Verification</h2>

  <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">
    Your one-time verification code is:
    <strong style="font-size: 28px; color: #2563eb; letter-spacing: 4px; display: block; margin: 12px 0; font-family: monospace;">${otp}</strong>
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

</div>
        `
      });
      console.log(`✅ SUCCESS: Sent OTP [${otp}] to ${acc.email} (MessageId: ${info.messageId})`);
    } catch (err) {
      console.error(`❌ FAILED for ${acc.email}: ${err.message}`);
    }
  }
})();
