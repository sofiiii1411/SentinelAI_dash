// Exact Firebase Schema Seeder for SentinelAI-X with serial login_501 .. login_510
const FIREBASE_DB_URL = "https://sentinelaidashboard-default-rtdb.firebaseio.com";

async function applyExactFirebaseStructure() {
  console.log("🚀 Applying exact Firebase RTDB Structure with serial keys login_501 ... login_510\n");

  const databasePayload = {
    users: {
      lab1: {
        email: "lab1.sentinelai@gmail.com",
        role: "Lab 1 Admin"
      },
      lab2: {
        email: "lab2.sentinelai@gmail.com",
        role: "Lab 2 Admin"
      },
      globalAdmin: {
        email: "global.sentinelai@gmail.com",
        role: "Global Admin"
      },
      securityAdmin: {
        email: "securitysuper.sentinelai@gmail.com",
        role: "Security Super Admin"
      }
    },
    loginLogs: {
      "2026": {
        "September": {
          "login_501": {
            email: "lab1.sentinelai@gmail.com",
            role: "Lab 1 Admin",
            date: "05-09-2026",
            time: "01:05:12 AM"
          },
          "login_502": {
            email: "lab2.sentinelai@gmail.com",
            role: "Lab 2 Admin",
            date: "05-09-2026",
            time: "01:10:24 AM"
          },
          "login_503": {
            email: "unknown@gmail.com",
            role: "Unauthorized User",
            date: "05-09-2026",
            time: "01:12:45 AM"
          },
          "login_504": {
            email: "global.sentinelai@gmail.com",
            role: "Global Admin",
            date: "05-09-2026",
            time: "01:15:30 AM"
          },
          "login_505": {
            email: "lab1.sentinelai@gmail.com",
            role: "Lab 1 Admin",
            date: "05-09-2026",
            time: "01:18:02 AM"
          },
          "login_506": {
            email: "intruder@domain.com",
            role: "Unauthorized User",
            date: "05-09-2026",
            time: "01:20:19 AM"
          },
          "login_507": {
            email: "securitysuper.sentinelai@gmail.com",
            role: "Security Super Admin",
            date: "05-09-2026",
            time: "01:22:40 AM"
          },
          "login_508": {
            email: "lab2.sentinelai@gmail.com",
            role: "Lab 2 Admin",
            date: "05-09-2026",
            time: "01:25:11 AM"
          },
          "login_509": {
            email: "attacker@proxy.net",
            role: "Unauthorized User",
            date: "05-09-2026",
            time: "01:27:55 AM"
          },
          "login_510": {
            email: "hacker@test.com",
            role: "Unauthorized User",
            date: "05-09-2026",
            time: "01:30:14 AM"
          }
        }
      }
    },
    loginStatus: {
      "2026": {
        "September": {
          totalLogins: 10,
          successfulLogins: 6,
          failedLogins: 4,
          failureCount: 4
        }
      }
    }
  };

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(databasePayload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("✅ Firebase RTDB Seeding Completed!");
    console.log("loginLogs keys:", Object.keys(data.loginLogs["2026"]["September"]));
    console.log("loginStatus:", data.loginStatus["2026"]["September"]);

  } catch (err) {
    console.error("❌ Error setting Firebase structure:", err.message);
  }
}

applyExactFirebaseStructure();
