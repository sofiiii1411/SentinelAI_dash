import os
import sys
from dotenv import load_dotenv
from email_service import send_otp_email

# Load environment
load_dotenv()

def run_test():
    print("=" * 60)
    print("🔍 SentinelAI-X Python SMTP Tester")
    print("=" * 60)

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = os.getenv("SMTP_PORT", "587")
    user = os.getenv("SMTP_USERNAME", "")
    pwd = os.getenv("SMTP_PASSWORD", "")
    from_email = os.getenv("SMTP_FROM_EMAIL", user)

    print(f"📡 SMTP Host       : {host}:{port}")
    print(f"👤 SMTP Username   : {user or '❌ (NOT SET in .env)'}")
    print(f"🔑 Password Status : {'✅ Configured (' + str(len(pwd)) + ' chars)' if pwd else '❌ (NOT SET in .env)'}")
    print(f"✉️  From Email      : {from_email or '❌ (NOT SET)'}")
    print("-" * 60)

    if not user or not pwd:
        print("⚠️  ERROR: SMTP_USERNAME or SMTP_PASSWORD is not set.")
        print("📝 Please configure your .env file with:")
        print("   SMTP_HOST=smtp.gmail.com")
        print("   SMTP_PORT=587")
        print("   SMTP_USERNAME=your-email@gmail.com")
        print("   SMTP_PASSWORD=your-16-char-app-password")
        print("   SMTP_FROM_EMAIL=your-email@gmail.com")
        sys.exit(1)

    target_email = sys.argv[1] if len(sys.argv) > 1 else user
    test_otp = "4829"

    print(f"🚀 Sending test OTP email to: {target_email} ...")
    success, msg = send_otp_email(target_email, test_otp, "SentinelAI-X Admin")

    print("-" * 60)
    if success:
        print(f"✅ SUCCESS! {msg}")
        print(f"📬 Check inbox for {target_email} (and Spam/Junk folder) for verification code: {test_otp}")
    else:
        print(f"❌ FAILED: {msg}")
        print("\n🔧 Troubleshooting Tips:")
        print(" 1. Did you enable 2-Step Verification on your Google Account?")
        print(" 2. Did you generate an 'App Password' (16 characters) at https://myaccount.google.com/apppasswords?")
        print(" 3. Do not use your regular Gmail login password.")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
