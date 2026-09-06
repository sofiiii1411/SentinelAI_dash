import os
import sys
from dotenv import load_dotenv
from email_service import send_otp_email, send_otp_via_resend, send_otp_via_emailjs_rest, send_otp_via_smtp

load_dotenv()

def run_test():
    print("=" * 65)
    print("🛡️ SentinelAI-X Multi-Channel Email Verification Tester")
    print("=" * 65)

    resend_key = os.getenv("RESEND_API_KEY", "")
    smtp_user = os.getenv("SMTP_USERNAME", "")
    smtp_pwd = os.getenv("SMTP_PASSWORD", "")

    print(f"📧 Resend API Key    : {'✅ Configured (' + resend_key[:8] + '...)' if resend_key else '⚪ (Not Set in .env)'}")
    print(f"📬 SMTP Account       : {'✅ Configured (' + smtp_user + ')' if (smtp_user and smtp_pwd) else '⚪ (Not Set in .env)'}")
    print(f"⚡ EmailJS REST       : ✅ Active & Ready (Fallback)")
    print("-" * 65)

    target_email = sys.argv[1] if len(sys.argv) > 1 else "lab1.sentinelai@gmail.com"
    test_otp = "9284"

    print(f"🎯 Target Recipient  : {target_email}")
    print(f"🔢 Test OTP Code      : {test_otp}")
    print("-" * 65)

    print("🚀 Dispatching email...")
    success, msg = send_otp_email(target_email, test_otp, "SentinelAI-X Admin")

    print("-" * 65)
    if success:
        print(f"✅ SUCCESS: {msg}")
        print(f"📬 Check inbox (and Spam/Junk folder) for {target_email}")
    else:
        print(f"❌ FAILED: {msg}")
    print("=" * 65)

if __name__ == "__main__":
    run_test()
