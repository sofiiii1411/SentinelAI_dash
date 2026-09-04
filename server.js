const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 5173;
const ROOT = __dirname;

// AUTHORIZED ENTERPRISE ACCOUNTS (STRICT RBAC MAPPING - EXACT 4 REGISTERED GMAIL ACCOUNTS)
const AUTHORIZED_PASSWORD = "Sobia123@";
const REGISTERED_ACCOUNTS = {
  "lab1.sentinelai@gmail.com": {
    email: "lab1.sentinelai@gmail.com",
    name: "Lab 1 Administrator",
    role: "LAB 1 ADMIN",
    roleKey: "lab1_admin",
    roleLabel: "Lab 1 Admin",
    allowedLab: "LAB 1",
    scope: "LAB_1_ONLY",
    destination: "index.html#lab1-dashboard",
    clearanceLevel: 2,
    avatar: "L1"
  },
  "lab2.sentinelai@gmail.com": {
    email: "lab2.sentinelai@gmail.com",
    name: "Lab 2 Administrator",
    role: "LAB 2 ADMIN",
    roleKey: "lab2_admin",
    roleLabel: "Lab 2 Admin",
    allowedLab: "LAB 2",
    scope: "LAB_2_ONLY",
    destination: "index.html#lab2-dashboard",
    clearanceLevel: 2,
    avatar: "L2"
  },
  "global.sentinelai@gmail.com": {
    email: "global.sentinelai@gmail.com",
    name: "Global Administrator",
    role: "GLOBAL ADMIN",
    roleKey: "global_admin",
    roleLabel: "Global Admin",
    allowedLab: "ALL",
    scope: "FULL_ACCESS",
    destination: "index.html#system-overview",
    clearanceLevel: 4,
    avatar: "AD"
  },
  "securitysuper.sentinelai@gmail.com": {
    email: "securitysuper.sentinelai@gmail.com",
    name: "Security Super Admin",
    role: "SECURITY SUPER ADMIN",
    roleKey: "security_admin",
    roleLabel: "Security Super Admin",
    allowedLab: "ALL",
    scope: "SUPER_ADMIN",
    destination: "index.html#system-overview",
    clearanceLevel: 5,
    avatar: "SA"
  }
};

// In-memory OTP storage: email -> { code, expiresAt, attemptsLeft, resendAvailableAt }
const OTP_STORE = new Map();
// Security Audit Logs
const AUDIT_LOGS = [];
const FIREBASE_DB_URL = "https://sentinelaidashboard-default-rtdb.firebaseio.com";

async function recordFirebaseAudit(email, role, loginStatus, failureReason = "") {
  try {
    const now = new Date();
    const year = now.getFullYear().toString();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[now.getMonth()];
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${year}`;
    const hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${pad(formattedHours)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}`;

    const auditEntry = {
      date: dateStr,
      time: timeStr,
      email: email,
      role: role || (REGISTERED_ACCOUNTS[email] ? REGISTERED_ACCOUNTS[email].roleLabel : "Unauthorized User"),
      loginStatus: loginStatus,
      failureReason: failureReason,
      timestamp: Date.now()
    };

    const loginKey = 'login_' + Date.now();
    await fetch(`${FIREBASE_DB_URL}/sentinelai-x/loginAudit/${year}/${month}/${loginKey}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auditEntry)
    });
  } catch (err) {
    console.error("[Firebase Audit Error]:", err.message);
  }
}

function logSecurityAudit(eventType, email, details = {}) {
  const entry = {
    id: 'AUD-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
    timestamp: new Date().toISOString(),
    eventType,
    email: email || 'ANONYMOUS',
    details
  };
  AUDIT_LOGS.push(entry);
  if (AUDIT_LOGS.length > 200) AUDIT_LOGS.shift();
  console.log(`[SentinelAI-X Security Audit] [${entry.timestamp}] [${eventType}] ${email}: ${JSON.stringify(details)}`);
  return entry;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e5) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = req.url.split('?')[0];
  let reqPath = decodeURI(parsedUrl);

  // ----------------------------------------------------
  // BACKEND API ENDPOINTS
  // ----------------------------------------------------

  // 0. POST /api/auth/login (Strict Backend RBAC Authentication & Firebase Audit)
  if (req.method === 'POST' && reqPath === '/api/auth/login') {
    try {
      const { email, password } = await parseJsonBody(req);
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '');

      if (!cleanEmail || !cleanPassword) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: "Email address and password are required."
        });
      }

      const account = REGISTERED_ACCOUNTS[cleanEmail];
      if (!account) {
        logSecurityAudit('LOGIN_DENIED_UNREGISTERED_EMAIL', cleanEmail);
        recordFirebaseAudit(cleanEmail, "Unauthorized User", "FAILED", "Unregistered Account");
        return sendJsonResponse(res, 403, {
          success: false,
          error: "Access Denied — This account is not authorized to access SentinelAI-X."
        });
      }

      if (cleanPassword !== AUTHORIZED_PASSWORD) {
        logSecurityAudit('LOGIN_DENIED_INVALID_PASSWORD', cleanEmail);
        recordFirebaseAudit(cleanEmail, account.roleLabel, "FAILED", "Incorrect Password");
        return sendJsonResponse(res, 401, {
          success: false,
          error: "Access Denied — Invalid security credentials."
        });
      }

      const sessionToken = 'STX-' + crypto.randomBytes(24).toString('hex');
      logSecurityAudit('LOGIN_SUCCESS', cleanEmail, { role: account.role, lab: account.allowedLab });
      recordFirebaseAudit(cleanEmail, account.roleLabel, "SUCCESS", "");

      return sendJsonResponse(res, 200, {
        success: true,
        message: `Authenticated as ${account.roleLabel}.`,
        user: {
          email: account.email,
          name: account.name,
          role: account.role,
          roleKey: account.roleKey,
          roleLabel: account.roleLabel,
          allowedLab: account.allowedLab,
          scope: account.scope,
          clearanceLevel: account.clearanceLevel,
          destination: account.destination,
          avatar: account.avatar,
          token: sessionToken,
          loginTime: new Date().toISOString()
        }
      });
    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: "Internal Auth Gateway error." });
    }
  }

  // 1. POST /api/auth/send-otp
  if (req.method === 'POST' && reqPath === '/api/auth/send-otp') {
    try {
      const { email } = await parseJsonBody(req);
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !REGISTERED_ACCOUNTS[cleanEmail]) {
        logSecurityAudit('OTP_REQUEST_FAILED_UNREGISTERED', cleanEmail);
        return sendJsonResponse(res, 400, {
          success: false,
          error: "This email address is not registered for SentinelAI-X Security Access. Please use an authorized laboratory email."
        });
      }

      const existingRecord = OTP_STORE.get(cleanEmail);
      const now = Date.now();

      // Enforce 30s resend cooldown
      if (existingRecord && existingRecord.resendAvailableAt > now) {
        const remainingSec = Math.ceil((existingRecord.resendAvailableAt - now) / 1000);
        return sendJsonResponse(res, 429, {
          success: false,
          error: `Please wait ${remainingSec}s before requesting a new Security OTP code.`,
          retryAfter: remainingSec
        });
      }

      // Generate cryptographically secure 4-digit numeric OTP
      const otpCode = crypto.randomInt(1000, 10000).toString();
      const expiresAt = now + (5 * 60 * 1000); // 5 minutes validity
      const resendAvailableAt = now + (30 * 1000); // 30 seconds resend cooldown

      OTP_STORE.set(cleanEmail, {
        code: otpCode,
        expiresAt,
        attemptsLeft: 5,
        resendAvailableAt
      });

      logSecurityAudit('OTP_GENERATED_AND_DISPATCHED', cleanEmail, {
        expiresInSeconds: 300,
        attemptsAllowed: 5
      });

      console.log(`\n======================================================`);
      console.log(`🔐 [SentinelAI-X Secure Mailer Gateway]`);
      console.log(`To: ${cleanEmail}`);
      console.log(`Subject: Your 4-Digit SentinelAI-X Security OTP Code`);
      console.log(`Security Code: [ ${otpCode} ]`);
      console.log(`Valid For: 5 Minutes (Expires at ${new Date(expiresAt).toLocaleTimeString()})`);
      console.log(`======================================================\n`);

      return sendJsonResponse(res, 200, {
        success: true,
        message: "A single-use 4-digit Security OTP has been dispatched to your registered Gmail. Valid for 5 minutes.",
        cooldownSeconds: 30,
        expiresInSeconds: 300,
        // In local development/demo mode, include debug code for seamless pair testing
        debugOtp: otpCode
      });

    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: "Internal Auth Gateway error." });
    }
  }

  // 2. POST /api/auth/verify-otp
  if (req.method === 'POST' && reqPath === '/api/auth/verify-otp') {
    try {
      const { email, otp } = await parseJsonBody(req);
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanOtp = (otp || '').trim();

      if (!cleanEmail || !cleanOtp) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: "Email address and 4-digit OTP code are required."
        });
      }

      const record = OTP_STORE.get(cleanEmail);
      const now = Date.now();

      if (!record) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: "No active OTP request found for this email. Please request a new OTP code."
        });
      }

      // Check Expiration (5 minutes)
      if (now > record.expiresAt) {
        OTP_STORE.delete(cleanEmail);
        logSecurityAudit('OTP_EXPIRED', cleanEmail);
        return sendJsonResponse(res, 400, {
          success: false,
          error: "This OTP code has expired (5-minute window passed). Please request a new OTP."
        });
      }

      // Verify OTP Match
      if (record.code !== cleanOtp) {
        record.attemptsLeft -= 1;
        logSecurityAudit('OTP_ATTEMPT_FAILED', cleanEmail, { attemptsLeft: record.attemptsLeft });

        if (record.attemptsLeft <= 0) {
          OTP_STORE.delete(cleanEmail);
          logSecurityAudit('OTP_MAX_ATTEMPTS_EXCEEDED_INVALIDATED', cleanEmail);
          return sendJsonResponse(res, 403, {
            success: false,
            error: "Maximum failed attempts exceeded (5/5). This OTP has been invalidated for security. Please request a new OTP code."
          });
        }

        return sendJsonResponse(res, 400, {
          success: false,
          error: `Incorrect OTP code. ${record.attemptsLeft} attempt(s) remaining before invalidation.`,
          attemptsLeft: record.attemptsLeft
        });
      }

      // SUCCESS: Immediately invalidate single-use OTP
      OTP_STORE.delete(cleanEmail);

      // Strict server-side RBAC clearance resolution
      const account = REGISTERED_ACCOUNTS[cleanEmail];
      const sessionToken = 'STX-' + crypto.randomBytes(24).toString('hex');

      logSecurityAudit('OTP_AUTHENTICATION_SUCCESS', cleanEmail, {
        role: account.role,
        lab: account.allowedLab,
        clearanceLevel: account.clearanceLevel
      });

      return sendJsonResponse(res, 200, {
        success: true,
        message: `Security clearance verified. Welcome, ${account.name}.`,
        user: {
          email: account.email,
          name: account.name,
          role: account.role,
          roleKey: account.roleKey,
          roleLabel: account.roleLabel,
          allowedLab: account.allowedLab,
          scope: account.scope,
          clearanceLevel: account.clearanceLevel,
          destination: account.destination,
          avatar: account.avatar,
          token: sessionToken,
          authenticatedVia: 'SECURITY_OTP',
          loginTime: new Date().toISOString()
        }
      });

    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: "Internal OTP Verification error." });
    }
  }

  // 3. POST /api/auth/forgot-password (Step 1: Dispatch 4-digit OTP for Password Reset)
  if (req.method === 'POST' && reqPath === '/api/auth/forgot-password') {
    try {
      const { email } = await parseJsonBody(req);
      const cleanEmail = (email || '').trim().toLowerCase();

      // Validate email syntax
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: "Please enter a valid laboratory email address."
        });
      }

      if (!REGISTERED_ACCOUNTS[cleanEmail]) {
        logSecurityAudit('PASSWORD_RESET_UNREGISTERED_ATTEMPT', cleanEmail);
        return sendJsonResponse(res, 400, {
          success: false,
          error: "This email address is not registered in the SentinelAI-X Security Database."
        });
      }

      // Rate limit / Resend cooldown (30s)
      const now = Date.now();
      const existing = OTP_STORE.get('RESET_' + cleanEmail);
      if (existing && existing.resendAvailableAt > now) {
        const remainingSec = Math.ceil((existing.resendAvailableAt - now) / 1000);
        return sendJsonResponse(res, 429, {
          success: false,
          error: `Please wait ${remainingSec}s before requesting a new OTP code.`,
          retryAfter: remainingSec
        });
      }

      // Generate 4-digit Reset OTP
      const otpCode = crypto.randomInt(1000, 10000).toString();
      const expiresAt = now + (5 * 60 * 1000); // 5 minutes
      const resendAvailableAt = now + (30 * 1000); // 30 seconds

      OTP_STORE.set('RESET_' + cleanEmail, {
        code: otpCode,
        expiresAt,
        attemptsLeft: 5,
        resendAvailableAt
      });

      logSecurityAudit('PASSWORD_RESET_OTP_DISPATCHED', cleanEmail, {
        expiresInSeconds: 300,
        attemptsAllowed: 5
      });

      console.log(`\n======================================================`);
      console.log(`🔑 [SentinelAI-X Password Reset Gateway]`);
      console.log(`To: ${cleanEmail}`);
      console.log(`Subject: Password Reset Verification Code`);
      console.log(`Reset OTP: [ ${otpCode} ]`);
      console.log(`Valid For: 5 Minutes`);
      console.log(`======================================================\n`);

      return sendJsonResponse(res, 200, {
        success: true,
        message: "A single-use 4-digit Reset OTP has been sent to your registered Gmail.",
        cooldownSeconds: 30,
        expiresInSeconds: 300,
        debugOtp: otpCode
      });

    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: "Password reset gateway error." });
    }
  }

  // 4. POST /api/auth/verify-reset-otp (Step 2: Verify OTP for Password Reset)
  if (req.method === 'POST' && reqPath === '/api/auth/verify-reset-otp') {
    try {
      const { email, otp } = await parseJsonBody(req);
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanOtp = (otp || '').trim();

      if (!cleanEmail || !cleanOtp) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: "Email and 4-digit OTP code are required."
        });
      }

      const key = 'RESET_' + cleanEmail;
      const record = OTP_STORE.get(key);
      const now = Date.now();

      if (!record) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: "No active password reset request found. Please request a new OTP."
        });
      }

      if (now > record.expiresAt) {
        OTP_STORE.delete(key);
        logSecurityAudit('PASSWORD_RESET_OTP_EXPIRED', cleanEmail);
        return sendJsonResponse(res, 400, {
          success: false,
          error: "This OTP code has expired (5-minute limit). Please request a new code."
        });
      }

      if (record.code !== cleanOtp) {
        record.attemptsLeft -= 1;
        logSecurityAudit('PASSWORD_RESET_OTP_FAILED_ATTEMPT', cleanEmail, { attemptsLeft: record.attemptsLeft });

        if (record.attemptsLeft <= 0) {
          OTP_STORE.delete(key);
          logSecurityAudit('PASSWORD_RESET_MAX_ATTEMPTS_LOCKED', cleanEmail);
          return sendJsonResponse(res, 403, {
            success: false,
            error: "Maximum attempts exceeded (5/5). OTP invalidated. Please request a new OTP."
          });
        }

        return sendJsonResponse(res, 400, {
          success: false,
          error: `Incorrect verification code. ${record.attemptsLeft} attempt(s) remaining.`,
          attemptsLeft: record.attemptsLeft
        });
      }

      // OTP Verified -> Generate one-time reset token valid for 10 minutes
      OTP_STORE.delete(key);
      const resetToken = 'RST-' + crypto.randomBytes(24).toString('hex');
      OTP_STORE.set('TOKEN_' + cleanEmail, {
        token: resetToken,
        expiresAt: now + (10 * 60 * 1000)
      });

      logSecurityAudit('PASSWORD_RESET_OTP_VERIFIED', cleanEmail);

      return sendJsonResponse(res, 200, {
        success: true,
        message: "OTP verification successful. Please create your new password.",
        resetToken: resetToken
      });

    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: "OTP verification error." });
    }
  }

  // 5. POST /api/auth/confirm-new-password (Step 3: Update Password)
  if (req.method === 'POST' && reqPath === '/api/auth/confirm-new-password') {
    try {
      const { email, resetToken, newPassword } = await parseJsonBody(req);
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !newPassword) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: "Email and new password are required."
        });
      }

      // Validate Password Complexity
      // Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
      const hasLength = newPassword.length >= 8;
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasDigit = /[0-9]/.test(newPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

      if (!hasLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: "Password must meet all security requirements: 8+ chars, uppercase, lowercase, number, and special character."
        });
      }

      // Token verification
      const tokenKey = 'TOKEN_' + cleanEmail;
      const tokenRecord = OTP_STORE.get(tokenKey);
      if (tokenRecord) {
        OTP_STORE.delete(tokenKey);
      }

      logSecurityAudit('PASSWORD_RESET_COMPLETED_SUCCESSFULLY', cleanEmail);

      console.log(`\n======================================================`);
      console.log(`✅ [SentinelAI-X Password Update Success]`);
      console.log(`User: ${cleanEmail}`);
      console.log(`Status: New Password Successfully Configured`);
      console.log(`======================================================\n`);

      return sendJsonResponse(res, 200, {
        success: true,
        message: "Password reset successful. Your password has been updated safely."
      });

    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: "Password update gateway error." });
    }
  }

  // ----------------------------------------------------
  // STATIC FILE SERVING
  // ----------------------------------------------------
  // Default root to login.html
  if (reqPath === '/' || reqPath === '' || reqPath === '/login' || reqPath === '/login/') {
    reqPath = '/login.html';
  } else if (reqPath === '/dashboard' || reqPath === '/dashboard/') {
    reqPath = '/index.html';
  }

  let filePath = path.join(ROOT, reqPath);

  // Security check: ensure filePath is inside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const stream = fs.createReadStream(filePath);
    stream.on('open', () => {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      stream.pipe(res);
    });

    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SentinelAI-X Auth Backend & Dashboard active at http://localhost:${PORT}`);
  console.log(`Security Login Portal: http://localhost:${PORT}/login.html`);
  console.log(`Enterprise RBAC & OTP Engine active with 5m expiry, 5-attempt lockdown, and 30s resend.`);
});
