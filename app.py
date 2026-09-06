
import os
import time
import secrets
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from email_service import send_otp_email

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS explicitly for Netlify production origin and local development
CORS(app, resources={r"/api/*": {
    "origins": [
        "https://sentinelai-x.netlify.app",
        "https://sentinel-ai.netlify.app",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:3000",
        "http://localhost:8080"
    ],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# EXACT 4 AUTHORIZED SENTINELAI-X ENTERPRISE ACCOUNTS
AUTHORIZED_ACCOUNTS = {
    "lab1.sentinelai@gmail.com": {
        "name": "Lab 1 Administrator",
        "role": "LAB 1 ADMIN",
        "roleKey": "lab1_admin",
        "allowedLab": "LAB 1",
        "clearanceLevel": 2
    },
    "lab2.sentinelai@gmail.com": {
        "name": "Lab 2 Administrator",
        "role": "LAB 2 ADMIN",
        "roleKey": "lab2_admin",
        "allowedLab": "LAB 2",
        "clearanceLevel": 2
    },
    "global.sentinelai@gmail.com": {
        "name": "Global Administrator",
        "role": "GLOBAL ADMIN",
        "roleKey": "global_admin",
        "allowedLab": "ALL",
        "clearanceLevel": 4
    },
    "securitysuper.sentinelai@gmail.com": {
        "name": "Security Super Admin",
        "role": "SECURITY SUPER ADMIN",
        "roleKey": "security_admin",
        "allowedLab": "ALL",
        "clearanceLevel": 5
    }
}

# In-Memory OTP Store
otp_storage = {}

OTP_EXPIRY_SECONDS = 300       # 5 minutes
RESEND_COOLDOWN_SECONDS = 30   # 30 seconds
MAX_VERIFY_ATTEMPTS = 5

def generate_secure_4digit_otp() -> str:
    """Generates a secure 4-digit numeric OTP (1000-9999)."""
    return str(secrets.randbelow(9000) + 1000)

# ==========================================
# PHASE 1: HEALTH ENDPOINT
# ==========================================
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "message": "SentinelAI-X backend is running",
        "service": "SentinelAI-X Flask OTP & Auth API",
        "authorized_accounts_count": len(AUTHORIZED_ACCOUNTS)
    }), 200

# ==========================================
# PHASE 3: DIAGNOSTIC TEST-OTP ENDPOINT (NO EMAIL DISPATCH)
# ==========================================
@app.route("/api/auth/test-otp", methods=["POST"])
def test_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({
            "success": False,
            "error": "MISSING_EMAIL",
            "message": "Email address is required."
        }), 400

    # Whitelist authorization verification
    if email not in AUTHORIZED_ACCOUNTS:
        return jsonify({
            "success": False,
            "error": "UNAUTHORIZED_EMAIL",
            "message": "This email address is not authorized for password recovery."
        }), 403

    now = time.time()
    otp_code = generate_secure_4digit_otp()

    # Store OTP securely without sending email
    otp_storage[email] = {
        "otp": otp_code,
        "expires_at": now + OTP_EXPIRY_SECONDS,
        "last_sent_at": now,
        "attempts": 0,
        "used": False,
        "reset_token": None
    }

    # Safe response — NEVER leaks the OTP
    return jsonify({
        "success": True,
        "message": "OTP generated successfully",
        "expires_in": OTP_EXPIRY_SECONDS
    }), 200

# ==========================================
# STEP 2: SEND OTP ENDPOINT
# ==========================================
@app.route("/api/send-otp", methods=["POST"])
@app.route("/api/auth/send-otp", methods=["POST"])
@app.route("/api/auth/forgot-password", methods=["POST"])
def send_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"success": False, "error": "MISSING_EMAIL", "message": "Email address is required."}), 400

    # Whitelist authorization verification
    if email not in AUTHORIZED_ACCOUNTS:
        return jsonify({
            "success": False,
            "error": "ACCESS_DENIED",
            "message": "Access Denied — This email is not authorized for SentinelAI-X recovery."
        }), 403

    now = time.time()
    existing = otp_storage.get(email)

    # Check 30-second cooldown
    if existing and (now - existing.get("last_sent_at", 0)) < RESEND_COOLDOWN_SECONDS:
        remaining = int(RESEND_COOLDOWN_SECONDS - (now - existing["last_sent_at"]))
        return jsonify({
            "success": False,
            "error": "COOLDOWN_ACTIVE",
            "message": f"Please wait {remaining} seconds before requesting another OTP."
        }), 429

    otp_code = generate_secure_4digit_otp()
    recipient_name = AUTHORIZED_ACCOUNTS[email]["name"]

    # Dispatch email via Python SMTP
    success, err_msg = send_otp_email(email, otp_code, recipient_name)

    if not success:
        return jsonify({
            "success": False,
            "error": "OTP_EMAIL_FAILED",
            "message": "We could not send the OTP right now. Please verify SMTP settings and try again."
        }), 500

    # Store OTP session only on SMTP success
    otp_storage[email] = {
        "otp": otp_code,
        "expires_at": now + OTP_EXPIRY_SECONDS,
        "last_sent_at": now,
        "attempts": 0,
        "used": False,
        "reset_token": None
    }

    return jsonify({
        "success": true if False else True,
        "message": "A 4-digit security OTP has been sent to your registered email address.",
        "expires_in": OTP_EXPIRY_SECONDS
    }), 200

# ==========================================
# STEP 3: RESEND OTP ENDPOINT
# ==========================================
@app.route("/api/resend-otp", methods=["POST"])
@app.route("/api/auth/resend-otp", methods=["POST"])
def resend_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email or email not in AUTHORIZED_ACCOUNTS:
        return jsonify({
            "success": False,
            "error": "INVALID_EMAIL",
            "message": "Valid authorized email is required."
        }), 400

    now = time.time()
    existing = otp_storage.get(email)

    if existing and (now - existing.get("last_sent_at", 0)) < RESEND_COOLDOWN_SECONDS:
        remaining = int(RESEND_COOLDOWN_SECONDS - (now - existing["last_sent_at"]))
        return jsonify({
            "success": False,
            "error": "COOLDOWN_ACTIVE",
            "message": f"Please wait {remaining} seconds before requesting a new OTP."
        }), 429

    # Generate NEW OTP and invalidate previous
    new_otp = generate_secure_4digit_otp()
    recipient_name = AUTHORIZED_ACCOUNTS[email]["name"]

    success, err_msg = send_otp_email(email, new_otp, recipient_name)

    if not success:
        return jsonify({
            "success": False,
            "error": "OTP_EMAIL_FAILED",
            "message": "Could not resend OTP via SMTP. Please try again later."
        }), 500

    # Store newly generated OTP and reset attempt counter
    otp_storage[email] = {
        "otp": new_otp,
        "expires_at": now + OTP_EXPIRY_SECONDS,
        "last_sent_at": now,
        "attempts": 0,
        "used": False,
        "reset_token": None
    }

    return jsonify({
        "success": True,
        "message": "A fresh 4-digit security OTP has been dispatched to your Gmail inbox."
    }), 200

# ==========================================
# STEP 4: VERIFY OTP ENDPOINT
# ==========================================
@app.route("/api/verify-otp", methods=["POST"])
@app.route("/api/auth/verify-otp", methods=["POST"])
@app.route("/api/auth/verify-reset-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    user_otp = str(data.get("otp") or "").strip()

    if not email or not user_otp:
        return jsonify({"success": False, "error": "MISSING_FIELDS", "message": "Email and OTP code are required."}), 400

    record = otp_storage.get(email)
    now = time.time()

    if not record:
        return jsonify({
            "success": False,
            "error": "NO_OTP_FOUND",
            "message": "No active recovery session found. Please request a new OTP."
        }), 400

    if record.get("used"):
        return jsonify({
            "success": False,
            "error": "OTP_ALREADY_USED",
            "message": "This OTP has already been used. Please request a fresh code."
        }), 400

    if now > record.get("expires_at", 0):
        return jsonify({
            "success": False,
            "error": "OTP_EXPIRED",
            "message": "This OTP code has expired (5-minute limit). Please click Resend OTP."
        }), 400

    if record.get("attempts", 0) >= MAX_VERIFY_ATTEMPTS:
        return jsonify({
            "success": False,
            "error": "MAX_ATTEMPTS_EXCEEDED",
            "message": "Maximum verification attempts exceeded. Please request a new OTP."
        }), 429

    # Verify code
    record["attempts"] += 1

    if record["otp"] != user_otp:
        remaining_attempts = MAX_VERIFY_ATTEMPTS - record["attempts"]
        return jsonify({
            "success": False,
            "error": "INCORRECT_OTP",
            "message": f"Incorrect 4-digit OTP code. {remaining_attempts} attempt(s) remaining."
        }), 400

    # Mark as used immediately
    record["used"] = True
    reset_token = f"SENTINEL-VERIFIED-{secrets.token_hex(16)}"
    record["reset_token"] = reset_token

    return jsonify({
        "success": True,
        "message": "Security code verified successfully.",
        "resetToken": reset_token
    }), 200

# ==========================================
# STEP 5: CONFIRM PASSWORD RESET ENDPOINT
# ==========================================
@app.route("/api/reset-password", methods=["POST"])
@app.route("/api/auth/reset-password", methods=["POST"])
@app.route("/api/auth/confirm-new-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    reset_token = data.get("resetToken") or data.get("reset_token") or ""
    new_password = data.get("newPassword") or data.get("new_password") or ""

    if not email or not new_password:
        return jsonify({"success": False, "error": "MISSING_FIELDS", "message": "Email and new password required."}), 400

    if len(new_password) < 6:
        return jsonify({"success": False, "error": "WEAK_PASSWORD", "message": "Password must be at least 6 characters."}), 400

    record = otp_storage.get(email)
    if not record or record.get("reset_token") != reset_token or not record.get("used"):
        return jsonify({
            "success": False,
            "error": "INVALID_TOKEN",
            "message": "Unauthorized or expired password reset session."
        }), 403

    # Invalidate session token
    record["reset_token"] = None

    return jsonify({
        "success": True,
        "message": "Password updated successfully. You may now log in with your new credentials."
    }), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🛡️ SentinelAI-X Flask SMTP Server running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
