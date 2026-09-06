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

        # HTML Body
        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5fc; margin: 0; padding: 30px; }}
    .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }}
    .badge {{ display: inline-block; padding: 6px 14px; background: rgba(59, 130, 246, 0.1); color: #2563eb; font-weight: 700; font-size: 11px; letter-spacing: 1.5px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; }}
    .title {{ color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 12px; }}
    .desc {{ color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }}
    .otp-box {{ background: linear-gradient(135deg, #f8fafc 0%, #edf2f9 100%); border: 2px dashed #93c5fd; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px; }}
    .otp-code {{ font-family: monospace, Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; }}
    .footer {{ color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 24px; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Security Verification</div>
    <h2 class="title">SentinelAI-X Security Verification</h2>
    <p class="desc">Hello <strong>{recipient_name}</strong>,<br>You requested a single-use 4-digit security code to verify your identity on the SentinelAI-X Platform.</p>
    
    <div class="otp-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 6px; letter-spacing: 1px;">Your 4-Digit Verification Code</div>
      <div class="otp-code">{otp_code}</div>
    </div>
    
    <p class="desc">This code is valid for <strong>5 minutes</strong>. For your security, do not share this code with anyone.</p>
    <p class="desc">If you did not request this verification code, please ignore this email.</p>
    
    <div class="footer">
      Regards,<br>
      <strong>SentinelAI-X Security Operations Team</strong><br>
      Enterprise Automated Verification System
    </div>
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
