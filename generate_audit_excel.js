const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 1. Audit Data Definition for 2026
const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const AUDIT_DATA_2026 = {
  "JANUARY": [
    { date: "05-01-2026", time: "09:12:15 AM", email: "lab1.sentinelai@gmail.com", role: "Lab 1 Admin", status: "SUCCESS", reason: "—" },
    { date: "05-01-2026", time: "09:18:42 AM", email: "lab2.sentinelai@gmail.com", role: "Lab 2 Admin", status: "FAILED", reason: "Incorrect Password" },
    { date: "08-01-2026", time: "10:30:05 AM", email: "global.sentinelai@gmail.com", role: "Global Admin", status: "SUCCESS", reason: "—" },
    { date: "12-01-2026", time: "11:05:33 AM", email: "securitysuper.sentinelai@gmail.com", role: "Security Super Admin", status: "FAILED", reason: "Incorrect Password" }
  ],
  "FEBRUARY": [
    { date: "02-02-2026", time: "08:45:12 AM", email: "lab1.sentinelai@gmail.com", role: "Lab 1 Admin", status: "SUCCESS", reason: "—" },
    { date: "07-02-2026", time: "10:15:30 AM", email: "global.sentinelai@gmail.com", role: "Global Admin", status: "FAILED", reason: "Incorrect Password" }
  ],
  "MARCH": [
    { date: "03-03-2026", time: "09:20:11 AM", email: "lab2.sentinelai@gmail.com", role: "Lab 2 Admin", status: "SUCCESS", reason: "—" }
  ],
  "APRIL": [],
  "MAY": [],
  "JUNE": [],
  "JULY": [],
  "AUGUST": [],
  "SEPTEMBER": [
    { date: "04-09-2026", time: "09:15:22 AM", email: "lab1.sentinelai@gmail.com", role: "Lab 1 Admin", status: "SUCCESS", reason: "—" },
    { date: "04-09-2026", time: "09:18:45 AM", email: "lab1.sentinelai@gmail.com", role: "Lab 1 Admin", status: "FAILED", reason: "Incorrect Password" },
    { date: "04-09-2026", time: "09:20:11 AM", email: "global.sentinelai@gmail.com", role: "Global Admin", status: "SUCCESS", reason: "—" },
    { date: "04-09-2026", time: "09:25:33 AM", email: "securitysuper.sentinelai@gmail.com", role: "Security Super Admin", status: "FAILED", reason: "Incorrect Password" }
  ],
  "OCTOBER": [],
  "NOVEMBER": [],
  "DECEMBER": []
};

// 2. Generate Summary Records
function generateSummaryData() {
  const summaryRows = [
    ["Month", "Total Logins", "Successful", "Failed", "Incorrect Password"]
  ];

  MONTHS.forEach(month => {
    const list = AUDIT_DATA_2026[month] || [];
    const total = list.length;
    const successful = list.filter(r => r.status === "SUCCESS").length;
    const failed = list.filter(r => r.status === "FAILED").length;
    const incorrectPwd = list.filter(r => r.reason === "Incorrect Password").length;

    summaryRows.push([
      month,
      total,
      successful,
      failed,
      incorrectPwd
    ]);
  });

  return summaryRows;
}

// 3. Build Multi-Sheet Workbook
function buildWorkbook() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: SUMMARY
  const summaryData = generateSummaryData();
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 16 }, // Month
    { wch: 14 }, // Total Logins
    { wch: 14 }, // Successful
    { wch: 12 }, // Failed
    { wch: 20 }  // Incorrect Password
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "SUMMARY");

  // Sheets 2-13: MONTHS 2026
  MONTHS.forEach(month => {
    const sheetName = `${month} 2026`.substring(0, 31); // Excel max 31 chars
    const records = AUDIT_DATA_2026[month] || [];
    
    const rows = [
      [`${month} 2026`],
      ["Date", "Time", "Email", "Role", "Login Status", "Failure Reason"]
    ];

    if (records.length === 0) {
      rows.push(["—", "—", "—", "—", "—", "No login activity"]);
    } else {
      records.forEach(r => {
        rows.push([
          r.date,
          r.time,
          r.email,
          r.role,
          r.status,
          r.reason
        ]);
      });
    }

    const wsMonth = XLSX.utils.aoa_to_sheet(rows);
    wsMonth['!cols'] = [
      { wch: 14 }, // Date
      { wch: 16 }, // Time
      { wch: 36 }, // Email
      { wch: 24 }, // Role
      { wch: 16 }, // Status
      { wch: 24 }  // Reason
    ];
    XLSX.utils.book_append_sheet(wb, wsMonth, sheetName);
  });

  const outPath = path.join(__dirname, "SentinelAI-X_Login_Audit_2026.xlsx");
  XLSX.writeFile(wb, outPath);
  console.log(`✅ Multi-Sheet Excel created successfully at: ${outPath}`);
  return outPath;
}

buildWorkbook();

module.exports = {
  AUDIT_DATA_2026,
  MONTHS,
  generateSummaryData,
  buildWorkbook
};
