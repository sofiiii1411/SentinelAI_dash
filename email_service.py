import os
import json
import urllib.request
import urllib.error
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def get_email_html(otp_code: str, recipient_name: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 30px 10px;">
  <div style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; max-width: 480px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
    
    <!-- Centered SentinelAI-X Official Logo -->
    <div style="margin-bottom: 18px;">
      <img src="https://sentinelai-x.netlify.app/logo-transparent.png" width="220" alt="SentinelAI-X Logo" style="display: block; margin: 0 auto;" />
    </div>

    <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">SentinelAI-X | Security Verification</h2>

    <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">
      Your one-time verification code is:
      <strong style="font-size: 28px; color: #2563eb; letter-spacing: 4px; display: block; margin: 12px 0; font-family: monospace;">{otp_code}</strong>
    </p>

    <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
      This OTP is valid for <strong>5 minutes</strong> and can be used only once.
    </p>

    <div style="font-size: 12px; color: #dc2626; background: #fef2f2; border: 1px solid #fee2e2; padding: 10px 14px; border-radius: 8px; margin: 0 0 20px 0; line-height: 1.5;">
      For your security, <strong>do not share this code with anyone</strong>. If you did not request this verification, please disregard this message.
    </div>

    <p style="font-size: 12px; color: #64748b; font-weight: 700; margin: 0;">
      — SentinelAI-X Security Team
    </p>

  </div>
</body>
</html>
"""

def send_otp_via_resend(to_email: str, otp_code: str, recipient_name: str) -> tuple[bool, str]:
    """Sends OTP using Resend REST API."""
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    if not api_key:
        return False, "RESEND_API_KEY not configured"

    from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev").strip()
    subject = "SentinelAI-X Security Verification Code"
    html_content = get_email_html(otp_code, recipient_name)

    payload = {
        "from": f"SentinelAI-X Security <{from_email}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }

    try:
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "SentinelAI-X-Server"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            return True, f"Resend dispatched successfully: {res_body}"
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return False, f"Resend API HTTP {e.code}: {err_body}"
    except Exception as e:
        return False, f"Resend API error: {str(e)}"

def send_otp_via_emailjs_rest(to_email: str, otp_code: str, recipient_name: str) -> tuple[bool, str]:
    """Sends OTP using direct EmailJS REST API."""
    service_id = os.getenv("EMAILJS_SERVICE_ID", "service_70mhtv8").strip()
    template_id = os.getenv("EMAILJS_TEMPLATE_ID", "template_njrbnce").strip()
    user_id = os.getenv("EMAILJS_PUBLIC_KEY", "hnzDsgOGflqpJ2Zsd").strip()

    payload = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": user_id,
        "template_params": {
            "otp_code": str(otp_code),
            "to_email": to_email,
            "reply_to": to_email,
            "email": to_email,
            "to_name": recipient_name,
            "name": recipient_name,
            "message": f"Your SentinelAI-X 4-digit verification code is: {otp_code}",
            "time": "5 minutes"
        }
    }

    try:
        req = urllib.request.Request(
            "https://api.emailjs.com/api/v1.0/email/send",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Origin": "https://sentinelai-x.netlify.app",
                "User-Agent": "SentinelAI-X-Server"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            return True, "EmailJS REST dispatched successfully"
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return False, f"EmailJS HTTP {e.code}: {err_body}"
    except Exception as e:
        return False, f"EmailJS REST error: {str(e)}"

def send_otp_via_smtp(to_email: str, otp_code: str, recipient_name: str) -> tuple[bool, str]:
    """Sends OTP using SMTP if configured."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", smtp_username).strip() or smtp_username

    if not smtp_username or not smtp_password:
        return False, "SMTP credentials missing"

    try:
        msg = EmailMessage()
        msg["Subject"] = "SentinelAI-X Security Verification Code"
        msg["From"] = f"SentinelAI-X Security <{smtp_from_email}>"
        msg["To"] = to_email
        msg["Reply-To"] = smtp_from_email
        msg.set_content(f"SentinelAI-X Verification Code: {otp_code} (Valid for 5 minutes).")
        msg.add_alternative(get_email_html(otp_code, recipient_name), subtype="html")

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        return True, "SMTP dispatched successfully"
    except Exception as e:
        return False, f"SMTP error: {str(e)}"

def send_otp_email(to_email: str, otp_code: str, recipient_name: str = "SentinelAI-X User") -> tuple[bool, str]:
    """
    Main dispatch function:
    1. Tries Resend API (if RESEND_API_KEY is provided)
    2. Tries SMTP (if configured)
    3. Tries EmailJS REST API
    """
    # 1. Resend API
    if os.getenv("RESEND_API_KEY"):
        success, msg = send_otp_via_resend(to_email, otp_code, recipient_name)
        if success:
            return True, msg
        print(f"⚠️ Resend failed: {msg}. Falling back to next channel...")

    # 2. Python SMTP
    if os.getenv("SMTP_USERNAME") and os.getenv("SMTP_PASSWORD"):
        success, msg = send_otp_via_smtp(to_email, otp_code, recipient_name)
        if success:
            return True, msg
        print(f"⚠️ SMTP failed: {msg}. Falling back to EmailJS REST...")

    # 3. Direct EmailJS REST API
    success, msg = send_otp_via_emailjs_rest(to_email, otp_code, recipient_name)
    if success:
        return True, msg

    return False, f"All email delivery channels failed. Last error: {msg}"
