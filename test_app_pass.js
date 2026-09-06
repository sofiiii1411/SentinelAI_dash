const nodemailer = require('nodemailer');

const appPass = 'sbijkfkjzijczqsn';
const candidates = [
  'sofiiii.1411@gmail.com',
  'lab1.sentinelai@gmail.com',
  'global.sentinelai@gmail.com',
  'lab2.sentinelai@gmail.com',
  'securitysuper.sentinelai@gmail.com'
];

(async () => {
  let matchedUser = null;
  for (const email of candidates) {
    console.log('Testing sender account:', email);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: appPass
      }
    });

    try {
      await transporter.verify();
      console.log('✅ SUCCESS! Verified Gmail App Password for:', email);
      matchedUser = email;
      
      const info = await transporter.sendMail({
        from: `"SentinelAI-X Security" <${email}>`,
        to: email,
        subject: 'SentinelAI-X Live OTP System Connected',
        text: 'Your SentinelAI-X OTP System has been successfully connected to Gmail SMTP using your Google App Password. Live OTP delivery is active!',
        html: `
          <div style="font-family: Arial, sans-serif; background: #0b0f19; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #38ef7d; margin-top: 0;">SentinelAI-X Security</h2>
            <p>Your Gmail App Password has been successfully verified!</p>
            <p>Security OTP delivery is now 100% active and connected directly to Gmail.</p>
            <div style="background: #111827; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #38ef7d;">READY</span>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">SentinelAI-X Autonomous Verification Node</p>
          </div>
        `
      });
      console.log('✅ Confirmation test email sent to', email, 'MessageId:', info.messageId);
      break;
    } catch (err) {
      console.log('❌ Failed for', email, ':', err.message);
    }
  }

  if (!matchedUser) {
    console.log('❌ None of the standard candidates matched. Please specify which Gmail address generated this App Password.');
  }
})();
