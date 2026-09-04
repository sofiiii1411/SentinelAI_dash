const { AUDIT_DATA_2026, MONTHS } = require('./generate_audit_excel');

const FIREBASE_DB_URL = "https://sentinelaidashboard-default-rtdb.firebaseio.com";

async function seedFirebase() {
  console.log(`📡 Connecting to Firebase Realtime Database: ${FIREBASE_DB_URL}...`);

  // 1. Users Structure
  const usersPayload = {
    "lab1": {
      email: "lab1.sentinelai@gmail.com",
      role: "Lab 1 Admin",
      roleKey: "lab1_admin",
      clearanceLevel: 2,
      allowedLab: "LAB 1"
    },
    "lab2": {
      email: "lab2.sentinelai@gmail.com",
      role: "Lab 2 Admin",
      roleKey: "lab2_admin",
      clearanceLevel: 2,
      allowedLab: "LAB 2"
    },
    "globalAdmin": {
      email: "global.sentinelai@gmail.com",
      role: "Global Admin",
      roleKey: "global_admin",
      clearanceLevel: 4,
      allowedLab: "ALL"
    },
    "securityAdmin": {
      email: "securitysuper.sentinelai@gmail.com",
      role: "Security Super Admin",
      roleKey: "security_admin",
      clearanceLevel: 5,
      allowedLab: "ALL"
    }
  };

  // 2. Format Login Audit Structure
  const loginAudit2026 = {};
  const loginSummary2026 = {};

  MONTHS.forEach(month => {
    const list = AUDIT_DATA_2026[month] || [];
    const monthCapitalized = month.charAt(0) + month.slice(1).toLowerCase();

    // Summary calculation
    const total = list.length;
    const successful = list.filter(r => r.status === "SUCCESS").length;
    const failed = list.filter(r => r.status === "FAILED").length;
    const incorrectPassword = list.filter(r => r.reason === "Incorrect Password").length;

    loginSummary2026[monthCapitalized] = {
      totalLogins: total,
      successful: successful,
      failed: failed,
      incorrectPassword: incorrectPassword
    };

    if (list.length > 0) {
      loginAudit2026[monthCapitalized] = {};
      list.forEach((r, idx) => {
        const loginKey = `login_${String(idx + 1).padStart(3, '0')}`;
        loginAudit2026[monthCapitalized][loginKey] = {
          date: r.date,
          time: r.time,
          email: r.email,
          role: r.role,
          loginStatus: r.status,
          failureReason: r.reason === "—" ? "" : r.reason,
          timestamp: Date.now()
        };
      });
    } else {
      loginAudit2026[monthCapitalized] = {
        status: "No login activity"
      };
    }
  });

  const fullPayload = {
    users: usersPayload,
    loginAudit: {
      "2026": loginAudit2026
    },
    loginSummary: {
      "2026": loginSummary2026
    },
    systemInfo: {
      name: "SentinelAI-X Laboratory Security System",
      version: "2.4.0",
      lastSynced: new Date().toISOString()
    }
  };

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/sentinelai-x.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullPayload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Successfully seeded SentinelAI-X data to Firebase Realtime Database!`);
      console.log(`🔗 Endpoint: ${FIREBASE_DB_URL}/sentinelai-x.json`);
    } else {
      const errText = await res.text();
      console.error(`⚠️ Firebase returned status ${res.status}:`, errText);
    }
  } catch (err) {
    console.error(`⚠️ Firebase network error:`, err.message);
  }
}

seedFirebase();
