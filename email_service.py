import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def send_otp_email(to_email: str, otp_code: str, recipient_name: str = "SentinelAI-X User") -> tuple[bool, str]:
    """
    Sends a 4-digit security OTP email using Python's smtplib and EmailMessage over TLS.
    Reads SMTP credentials securely from environment variables.
    
    Returns:
        tuple (success: bool, message: str)
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", smtp_username).strip() or smtp_username

    if not smtp_username or not smtp_password:
        return False, "SMTP credentials missing. Please set SMTP_USERNAME and SMTP_PASSWORD in .env"

    try:
        msg = EmailMessage()
        msg["Subject"] = f"SentinelAI-X Security Verification Code"
        msg["From"] = f"SentinelAI-X Security <{smtp_from_email}>"
        msg["To"] = to_email
        msg["Reply-To"] = smtp_from_email

        # Plaintext Fallback
        plain_body = f"""SentinelAI-X Security Verification

Hello {recipient_name},

Your 4-digit security verification code is:
{otp_code}

This code is valid for 5 minutes.
For your security, do not share this code with anyone.
If you did not request this verification code, please ignore this email.

Regards,
SentinelAI-X Security Team
"""
        msg.set_content(plain_body)

        # HTML Body (Exact Official SentinelAI-X Format)
        html_body = f"""<!DOCTYPE html>
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
      — SentinelAI-X Security System
    </p>

  </div>
</body>
</html>
"""
        msg.add_alternative(html_body, subtype="html")

        # Connect over TLS (port 587)
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)

        return True, "OTP email dispatched successfully."

    except smtplib.SMTPAuthenticationError as auth_err:
        return False, f"SMTP Authentication failed. Ensure you are using a 16-character Gmail App Password. Error: {auth_err}"
    except smtplib.SMTPException as smtp_err:
        return False, f"SMTP error occurred: {smtp_err}"
    except Exception as e:
        return False, f"Failed to send email: {str(e)}"
