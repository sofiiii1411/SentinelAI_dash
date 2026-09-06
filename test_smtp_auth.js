const nodemailer = require('nodemailer');

async function testGmailCredentials() {
  console.log("=================================================");
  console.log("🔍 Testing Gmail SMTP with provided credentials...");
  console.log("=================================================");

  const configs = [
    { user: 'lab1.sentinelai@gmail.com', pass: 'Sobia123@' },
    { user: 'sofiiii.1411@gmail.com', pass: 'Sobia123@' },
    { user: 'global.sentinelai@gmail.com', pass: 'Sobia123@' },
    { user: 'securitysuper.sentinelai@gmail.com', pass: 'Sobia123@' }
  ];

  for (const cfg of configs) {
    console.log(`\nTesting SMTP for ${cfg.user}...`);
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: cfg.user,
          pass: cfg.pass
        }
      });

      await transporter.verify();
      console.log(`✅ SUCCESS! Authentication verified for ${cfg.user}`);

      // Try sending a test email
      const info = await transporter.sendMail({
        from: `SentinelAI-X Security <${cfg.user}>`,
        to: cfg.user,
        subject: "SentinelAI-X Test OTP Code",
        text: "Your OTP is 9876. Valid for 5 minutes."
      });
      console.log(`✉️ Email sent successfully! Message ID: ${info.messageId}`);
    } catch (err) {
      console.log(`❌ FAILED for ${cfg.user}: ${err.message}`);
    }
  }
}

testGmailCredentials();
