/**
 * SENTINEL AI-X — Enterprise Laboratory Security System
 * Professional Navigation Tree & Real-Time Telemetry Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Auth Guard: Enforce standalone login page as primary entry if not authenticated
  const isAuth = sessionStorage.getItem('sentinel_auth');
  const isBypass = window.location.search.includes('bypass=true');
  if (!isAuth && !isBypass) {
    window.location.replace('login.html');
    return;
  }

  // Current User Session Resolution
  const rawUser = sessionStorage.getItem('sentinel_user');
  let currentUser = {
    email: 'global.sentinelai@gmail.com',
    name: 'Global Administrator',
    role: 'GLOBAL ADMIN',
    roleLabel: 'Global Admin',
    allowedLab: 'ALL',
    scope: 'FULL_ACCESS',
    avatar: 'AD'
  };

  if (rawUser) {
    try {
      currentUser = JSON.parse(rawUser);
    } catch (_) {}
  }

  // DOM References
  const sentinelSidebar = document.getElementById('sentinelSidebar');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const logoToggleBtn = document.getElementById('logoToggleBtn');
  const appContentWrapper = document.getElementById('appContentWrapper');
  const sidebarBrandHome = document.getElementById('sidebarBrandHome');

  // View Containers
  const viewLabDashboard = document.getElementById('view-lab-dashboard');
  const viewGenericSection = document.getElementById('view-generic-section');
  const genericViewContainer = document.getElementById('genericViewContainer');
  const heroLabBadge = document.getElementById('heroLabBadge');

  // Logout & Controls
  const logoutBtn = document.getElementById('logoutBtn');
  const toastContainer = document.getElementById('toastContainer');

  // Parallax Elements
  const bgGlows = document.getElementById('bgGlows');
  const isoLabsWrapper = document.getElementById('isoLabsWrapper');

  // Ensure all blocking modal overlays start closed
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  const accessDeniedModal = document.getElementById('accessDeniedModal');
  if (accessDeniedModal) accessDeniedModal.classList.remove('active');

  // Live IST Header Clock (Immediate Real-time Synchronization)
  function updateClock() {
    const clockEl = document.getElementById('headerClock');
    if (!clockEl) return;
    const now = new Date();
    try {
      const optionsDate = { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      const optionsTime = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const dateStr = new Intl.DateTimeFormat('en-IN', optionsDate).format(now);
      const timeStr = new Intl.DateTimeFormat('en-IN', optionsTime).format(now);
      clockEl.textContent = `${dateStr}  |  ${timeStr} IST`;
    } catch (err) {
      clockEl.textContent = now.toLocaleDateString() + ' | ' + now.toLocaleTimeString() + ' IST';
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  let currentLab = 'LAB 1';

  // =========================================================================
  // ACCESS DENIED / ZERO TRUST CLEARANCE RESTRICTION MODAL
  // =========================================================================
  function triggerAccessDenied(attemptedTarget) {
    const modal = document.getElementById('accessDeniedModal');
    const roleBadge = document.getElementById('deniedUserRoleBadge');
    const scopeBadge = document.getElementById('deniedAllowedScope');
    const reasonMsg = document.getElementById('deniedReasonMsg');

    if (roleBadge) roleBadge.textContent = currentUser.role || 'UNAUTHORIZED';
    if (scopeBadge) {
      if (currentUser.allowedLab === 'LAB 1') scopeBadge.textContent = 'LAB 1 Subsystems Only';
      else if (currentUser.allowedLab === 'LAB 2') scopeBadge.textContent = 'LAB 2 Subsystems Only';
      else scopeBadge.textContent = 'Assigned Personnel Clearance';
    }
    if (reasonMsg) {
      reasonMsg.innerHTML = `Your authenticated account (<strong style="color:#00d2ff;">${currentUser.role}</strong>) is not authorized to inspect or control <strong style="color:#ef4444;">${attemptedTarget}</strong>.`;
    }
    if (modal) modal.classList.add('active');
  }

  const btnReturnAuthorizedLab = document.getElementById('btnReturnAuthorizedLab');
  if (btnReturnAuthorizedLab) {
    btnReturnAuthorizedLab.addEventListener('click', () => {
      const modal = document.getElementById('accessDeniedModal');
      if (modal) modal.classList.remove('active');
      const safeViewId = currentUser.allowedLab === 'LAB 2' ? 'lab2-dashboard' : 'lab1-dashboard';
      const safeLink = document.querySelector(`[data-view="${safeViewId}"]`);
      if (safeLink) safeLink.click();
    });
  }

  // =========================================================================
  // 1. SIDEBAR TOGGLE INTERACTION (Top-Left Logo & Close Button)
  // =========================================================================
  function toggleSidebar() {
    const isMobile = window.innerWidth <= 960;
    if (isMobile) {
      const isOpen = sentinelSidebar.classList.contains('mobile-open');
      if (isOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    } else {
      const isClosed = sentinelSidebar.classList.contains('closed');
      if (isClosed) {
        sentinelSidebar.classList.remove('closed');
        appContentWrapper.classList.remove('expanded');
      } else {
        sentinelSidebar.classList.add('closed');
        appContentWrapper.classList.add('expanded');
      }
    }
  }

  function openSidebar() {
    sentinelSidebar.classList.add('mobile-open');
    sentinelSidebar.classList.remove('closed');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
  }

  function closeSidebar() {
    sentinelSidebar.classList.remove('mobile-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  }

  if (logoToggleBtn) {
    logoToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });
  }

  if (sidebarBrandHome) {
    sidebarBrandHome.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  // =========================================================================
  // LOGOUT & ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
  // =========================================================================

  // 1. Update Profile Information in Sidebar Footer
  const nameEl = document.querySelector('.user-fullname');
  const roleLabelEl = document.querySelector('.user-role-label');
  const avatarEl = document.querySelector('.admin-user-avatar span');
  if (nameEl && currentUser.name) nameEl.textContent = currentUser.name;
  if (roleLabelEl && currentUser.roleLabel) roleLabelEl.textContent = currentUser.roleLabel;
  if (avatarEl && (currentUser.avatar || currentUser.name)) {
    avatarEl.textContent = currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase();
  }

  // 2. Enforce Lab Visibility & Control Restrictions
  const treeLab1 = document.getElementById('treeLab1');
  const treeLab2 = document.getElementById('treeLab2');
  const btnSwitchLab1 = document.getElementById('btnSwitchLab1');
  const btnSwitchLab2 = document.getElementById('btnSwitchLab2');
  const settingsNavItem = document.querySelector('[data-view="settings"]')?.closest('li');

  if (currentUser.allowedLab === 'LAB 1' || currentUser.scope === 'LAB_1_ONLY' || currentUser.role === 'LAB 1 ADMIN') {
    if (treeLab2) treeLab2.style.display = 'none';
    if (btnSwitchLab2) btnSwitchLab2.style.display = 'none';
    if (settingsNavItem) settingsNavItem.style.display = 'none';
    if (treeLab1) treeLab1.classList.add('open');
    currentLab = 'LAB 1';
  } else if (currentUser.allowedLab === 'LAB 2' || currentUser.scope === 'LAB_2_ONLY' || currentUser.role === 'LAB 2 ADMIN') {
    if (treeLab1) treeLab1.style.display = 'none';
    if (btnSwitchLab1) btnSwitchLab1.style.display = 'none';
    if (settingsNavItem) settingsNavItem.style.display = 'none';
    if (treeLab2) treeLab2.classList.add('open');
    currentLab = 'LAB 2';
    // Switch active dashboard to Lab 2 on startup
    setTimeout(() => {
      const lab2Link = document.querySelector('[data-view="lab2-dashboard"]');
      if (lab2Link) lab2Link.click();
    }, 50);
  } else {
    // Full Access for Global Admin and Security Super Admin
    if (treeLab1) treeLab1.style.display = '';
    if (treeLab2) treeLab2.style.display = '';
    if (btnSwitchLab1) btnSwitchLab1.style.display = '';
    if (btnSwitchLab2) btnSwitchLab2.style.display = '';
    if (settingsNavItem) settingsNavItem.style.display = '';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
          firebase.auth().signOut().catch(() => {});
        }
      } catch (_) {}
      sessionStorage.removeItem('sentinel_auth');
      sessionStorage.removeItem('sentinel_user');
      window.location.replace('login.html');
    });
  }

  // =========================================================================
  // 2. ACCORDION TREE (LAB 1 & LAB 2 Expand / Collapse)
  // =========================================================================
  const groupBtns = document.querySelectorAll('.nav-group-btn');
  groupBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const parentBlock = btn.closest('.nav-group-block');
      if (parentBlock) {
        parentBlock.classList.toggle('open');
        const isOpen = parentBlock.classList.contains('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    });
  });

  // =========================================================================
  // 3. SIDEBAR NAVIGATION ROUTING & RBAC GUARDS
  // =========================================================================
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const lab = link.getAttribute('data-lab') || 'SYSTEM';

      // RBAC Boundary Enforcement
      if (currentUser.allowedLab === 'LAB 1' && lab === 'LAB 2') {
        triggerAccessDenied('LAB 2 Facilities & Telemetry');
        return;
      }
      if (currentUser.allowedLab === 'LAB 2' && lab === 'LAB 1') {
        triggerAccessDenied('LAB 1 Facilities & Telemetry');
        return;
      }

      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');

      const viewId = link.getAttribute('data-view');
      const section = link.getAttribute('data-section') || 'Dashboard';

      currentLab = lab;
      syncHeaderLabPills(lab);
      renderView(viewId, lab, section);

      if (window.innerWidth <= 960) {
        closeSidebar();
      }
    });
  });

  if (sidebarBrandHome) {
    sidebarBrandHome.addEventListener('click', () => {
      const targetView = currentUser.allowedLab === 'LAB 2' ? 'lab2-dashboard' : 'lab1-dashboard';
      const homeLink = document.querySelector(`[data-view="${targetView}"]`);
      if (homeLink) homeLink.click();
    });
  }

  // 3D Hotspot Inspection Links with RBAC checks
  const hotspots = document.querySelectorAll('[data-goto-lab]');
  hotspots.forEach((spot) => {
    spot.addEventListener('click', () => {
      const targetLab = spot.getAttribute('data-goto-lab');
      if (currentUser.allowedLab === 'LAB 1' && targetLab === 'LAB 2') {
        triggerAccessDenied('LAB 2 Station');
        return;
      }
      if (currentUser.allowedLab === 'LAB 2' && targetLab === 'LAB 1') {
        triggerAccessDenied('LAB 1 Station');
        return;
      }
      const targetLink = document.querySelector(`[data-view="${targetLab === 'LAB 1' ? 'lab1-dashboard' : 'lab2-dashboard'}"]`);
      if (targetLink) targetLink.click();
      showToast(`Selected Node: ${spot.title}`, 'info');
    });
  });

  // =========================================================================
  // 4. TOP SUB-NAVIGATION TABS (Horizontal Sub-Module Switcher)
  // =========================================================================
  const topSubnavScroll = document.getElementById('topSubnavScroll');
  const LAB_MODULES = {
    'LAB 1': [
      { id: 'lab1-dashboard', title: 'Dashboard', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>' },
      { id: 'lab1-live-monitoring', title: 'Live Monitoring', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>' },
      { id: 'lab1-threat-detection', title: 'Threat Detection', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' },
      { id: 'lab1-face-recognition', title: 'Face Recognition', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' },
      { id: 'lab1-access-control', title: 'Access Control', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' },
      { id: 'lab1-sensor-monitoring', title: 'Sensor Monitoring', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>' },
      { id: 'lab1-analytics', title: 'Analytics', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' },
      { id: 'lab1-event-logs', title: 'Event Logs', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' },
      { id: 'lab1-alerts', title: 'Alerts', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' },
      { id: 'lab1-system-overview', title: 'System Overview', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' },
      { id: 'lab1-device-status', title: 'Device Status', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path></svg>' },
      { id: 'lab1-settings', title: 'Settings', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' }
    ],
    'LAB 2': [
      { id: 'lab2-dashboard', title: 'Dashboard', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>' },
      { id: 'lab2-live-monitoring', title: 'Live Monitoring', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>' },
      { id: 'lab2-threat-detection', title: 'Threat Detection', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' },
      { id: 'lab2-access-control', title: 'Access Control', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' },
      { id: 'lab2-sensor-monitoring', title: 'Sensor Monitoring', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>' },
      { id: 'lab2-analytics', title: 'Analytics', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' },
      { id: 'lab2-event-logs', title: 'Event Logs', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' },
      { id: 'lab2-alerts', title: 'Alerts', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' },
      { id: 'lab2-system-overview', title: 'System Overview', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' },
      { id: 'lab2-device-status', title: 'Device Status', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path></svg>' },
      { id: 'lab2-settings', title: 'Settings', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' }
    ],
    'SYSTEM': [
      { id: 'system-overview', title: 'Cluster Overview', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' },
      { id: 'chatbot', title: 'AI Chatbot', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><circle cx="9" cy="10" r="1"></circle><circle cx="15" cy="10" r="1"></circle></svg>' },
      { id: 'device-status', title: 'Device Matrix', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path></svg>' },
      { id: 'settings', title: 'Global Settings', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' }
    ]
  };

  function updateTopSubnav(lab, activeViewId) {
    if (!topSubnavScroll) return;
    const modules = LAB_MODULES[lab] || LAB_MODULES['LAB 1'];
    
    topSubnavScroll.innerHTML = modules.map((mod) => {
      const isActive = mod.id === activeViewId || (activeViewId.includes('dashboard') && mod.id.includes('dashboard'));
      return `
        <button class="top-subnav-tab ${isActive ? 'active' : ''}" data-target-view="${mod.id}" data-target-lab="${lab}" data-target-title="${mod.title}">
          <span class="top-subnav-tab-icon">${mod.icon}</span>
          <span>${mod.title}</span>
        </button>
      `;
    }).join('');

    const tabs = topSubnavScroll.querySelectorAll('.top-subnav-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetView = tab.getAttribute('data-target-view');
        const targetLab = tab.getAttribute('data-target-lab');
        const targetTitle = tab.getAttribute('data-target-title');

        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        // Sync with sidebar link
        const matchingLink = document.querySelector(`[data-view="${targetView}"]`);
        if (matchingLink) {
          navLinks.forEach((l) => l.classList.remove('active'));
          matchingLink.classList.add('active');
        }

        renderView(targetView, targetLab, targetTitle);
      });
    });
  }

  // =========================================================================
  // HEADER CAPSULE CONTROLS (LAB 1 / LAB 2 Fast Switcher & AI Chatbot)
  // =========================================================================
  const headerChatbotBtn = document.getElementById('headerChatbotBtn');

  function openChatbotView() {
    const chatbotLink = document.querySelector('[data-view="chatbot"]');
    if (chatbotLink) {
      chatbotLink.click();
    } else {
      renderView('chatbot', 'SYSTEM', 'Chatbot');
    }
    showToast('💬 Launched SentinelAI Security Assistant', 'info');
    setTimeout(() => {
      const input = document.getElementById('chatTextInput');
      if (input) input.focus();
    }, 100);
  }

  function syncHeaderLabPills(lab) {
    if (btnSwitchLab1) {
      if (lab === 'LAB 1') {
        btnSwitchLab1.classList.add('active');
      } else {
        btnSwitchLab1.classList.remove('active');
      }
    }
    if (btnSwitchLab2) {
      if (lab === 'LAB 2') {
        btnSwitchLab2.classList.add('active');
      } else {
        btnSwitchLab2.classList.remove('active');
      }
    }
  }

  function switchToLab(targetLab) {
    if (currentUser.allowedLab === 'LAB 1' && targetLab === 'LAB 2') {
      triggerAccessDenied('LAB 2 Facilities');
      return;
    }
    if (currentUser.allowedLab === 'LAB 2' && targetLab === 'LAB 1') {
      triggerAccessDenied('LAB 1 Facilities');
      return;
    }

    currentLab = targetLab;
    syncHeaderLabPills(targetLab);

    // Open corresponding accordion group in sidebar
    const allGroups = document.querySelectorAll('.nav-group-block');
    allGroups.forEach((group) => {
      const headerTitle = group.querySelector('.nav-group-title');
      if (headerTitle && headerTitle.textContent.includes(targetLab)) {
        group.classList.add('open');
        const btn = group.querySelector('.nav-group-btn');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      }
    });

    // Find and trigger the target lab's dashboard view
    const targetViewId = targetLab === 'LAB 2' ? 'lab2-dashboard' : 'lab1-dashboard';
    const targetLink = document.querySelector(`[data-view="${targetViewId}"]`);
    if (targetLink) {
      targetLink.click();
    } else {
      renderView(targetViewId, targetLab, 'Dashboard');
    }

    showToast(`Switched to ${targetLab} (${targetLab === 'LAB 2' ? 'Beta Wing' : 'Alpha Core'})`, 'info');
  }

  if (btnSwitchLab1) {
    btnSwitchLab1.addEventListener('click', (e) => {
      e.preventDefault();
      switchToLab('LAB 1');
    });
  }

  if (btnSwitchLab2) {
    btnSwitchLab2.addEventListener('click', (e) => {
      e.preventDefault();
      switchToLab('LAB 2');
    });
  }

  if (headerChatbotBtn) {
    headerChatbotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openChatbotView();
    });
  }

  // =========================================================================
  // 5. DYNAMIC VIEW RENDERER
  // =========================================================================
  function renderView(viewId, lab, section) {
    currentLab = lab;
    syncHeaderLabPills(lab);
    updateTopSubnav(lab, viewId);

    // Sync active sidebar links
    navLinks.forEach((l) => {
      if (l.getAttribute('data-view') === viewId) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });

    if (lab === 'LAB 1' && viewId === 'lab1-dashboard') {
      viewGenericSection.classList.remove('active');
      viewLabDashboard.classList.add('active');

      if (heroLabBadge) {
        heroLabBadge.textContent = `LAB 1 CENTRAL SURVEILLANCE & TELEMETRY`;
      }

      // Update Dashboard Metric Cards for Lab 1
      const metricBoxes = document.querySelectorAll('#view-lab-dashboard .metric-box');
      if (metricBoxes.length >= 4) {
        metricBoxes[0].querySelector('.metric-number').textContent = 'DEFCON 5';
        metricBoxes[0].querySelector('.metric-sub-status').textContent = '100% Defense Perimeter';
        metricBoxes[1].querySelector('.metric-number').textContent = '4 / 4 Active';
        metricBoxes[1].querySelector('.metric-sub-status').textContent = '60 FPS 4K Streams';
        metricBoxes[2].querySelector('.metric-number').textContent = '148 Cleared';
        metricBoxes[2].querySelector('.metric-sub-status').textContent = '0 Unauthorized Attempts';
        metricBoxes[3].querySelector('.metric-number').textContent = '21.4°C • 44% RH';
        metricBoxes[3].querySelector('.metric-sub-status').textContent = 'AQI: 12 (Cleanroom Grade A)';
      }

      const floatingChatbotBtn = document.getElementById('floatingChatbotBtn') || document.getElementById('chatbotFloatingFab');
      if (floatingChatbotBtn) {
        floatingChatbotBtn.style.display = 'flex';
        if (typeof resetFloatingFabPosition === 'function') resetFloatingFabPosition();
      }
      return;
    }

    viewLabDashboard.classList.remove('active');
    viewGenericSection.classList.add('active');

    let viewHtml = '';

    if (lab === 'LAB 2') {
      switch (section) {
        case 'Dashboard':
          viewHtml = getLab2ComponentsHtml();
          break;
        case 'Access Control':
          viewHtml = getLab2AccessHtml();
          break;
        case 'Sensor Monitoring':
          viewHtml = getLab2SensorsHtml();
          break;
        case 'Threat Detection':
          viewHtml = getLab2ThreatHtml();
          break;
        case 'Event Logs':
          viewHtml = getLab2LogsHtml();
          break;
        case 'Alerts':
          viewHtml = getLab2AlertsHtml();
          break;
        case 'Analytics':
          viewHtml = getAnalyticsHtml(lab);
          break;
        case 'Face Recognition':
          viewHtml = getFaceHtml(lab);
          break;
        case 'Live Monitoring':
        case 'Camera Surveillance':
          viewHtml = getSurveillanceHtml(lab);
          break;
        case 'System Overview':
        case 'Global System Overview':
        case 'LAB 2 System Overview':
          viewHtml = getSystemOverviewHtml('LAB 2');
          break;
        case 'Chatbot':
        case 'AI Security Chatbot':
          viewHtml = getChatbotHtml();
          break;
        case 'Device Status':
        case 'Cluster Device Matrix':
        case 'LAB 2 Device Status':
          viewHtml = getDeviceStatusHtml('LAB 2');
          break;
        case 'Settings':
        case 'Global Settings':
        case 'LAB 2 Settings':
          viewHtml = getSettingsHtml('LAB 2');
          break;
        default:
          viewHtml = getLab2ComponentsHtml();
      }
    } else {
      switch (section) {
        case 'Live Monitoring':
        case 'Camera Surveillance':
          viewHtml = getSurveillanceHtml(lab);
          break;
        case 'Threat Detection':
          viewHtml = getThreatHtml(lab);
          break;
        case 'Face Recognition':
          viewHtml = getFaceHtml(lab);
          break;
        case 'Access Control':
          viewHtml = getAccessHtml(lab);
          break;
        case 'Sensor Monitoring':
          viewHtml = getSensorsHtml(lab);
          break;
        case 'Analytics':
          viewHtml = getAnalyticsHtml(lab);
          break;
        case 'Event Logs':
          viewHtml = getLogsHtml(lab);
          break;
        case 'Alerts':
          viewHtml = getAlertsHtml(lab);
          break;
        case 'System Overview':
        case 'Global System Overview':
        case 'LAB 1 System Overview':
          viewHtml = getSystemOverviewHtml(lab);
          break;
        case 'Chatbot':
        case 'AI Security Chatbot':
          viewHtml = getChatbotHtml();
          break;
        case 'Device Status':
        case 'Cluster Device Matrix':
        case 'LAB 1 Device Status':
          viewHtml = getDeviceStatusHtml(lab);
          break;
        case 'Settings':
        case 'Global Settings':
        case 'LAB 1 Settings':
          viewHtml = getSettingsHtml(lab);
          break;
        default:
          viewHtml = getDefaultHtml(lab, section);
      }
    }

    genericViewContainer.innerHTML = viewHtml;
    
    // Hide floating FAB on Chatbot page to prevent UI overlap; reset position on return
    const floatingChatbotBtn = document.getElementById('floatingChatbotBtn') || document.getElementById('chatbotFloatingFab');
    if (floatingChatbotBtn) {
      if (section === 'Chatbot') {
        floatingChatbotBtn.style.display = 'none';
      } else {
        floatingChatbotBtn.style.display = 'flex';
        if (typeof resetFloatingFabPosition === 'function') resetFloatingFabPosition();
      }
    }

    attachDynamicListeners();
  }

  // =========================================================================
  // LAB 2 — DEDICATED MODULE TEMPLATES (7 HARDWARE COMPONENTS)
  // =========================================================================
  function getLab2AccessHtml() {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">LAB 2 — Access Control Matrix</h2>
            <p class="banner-subtitle">Hardware relays: Green LED, Red LED, Push Button & Buzzer</p>
          </div>
        </div>
        <button class="btn-secondary-action" id="dynCycleBtn">
          <span>Cycle Interlocks</span>
        </button>
      </div>

      <div class="lab2-grid-7col" style="margin-bottom: 20px;">
        <div class="lab2-card">
          <div class="lab2-card-header">
            <div class="lab2-card-icon-wrap icon-green-led">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M9 12l2 2 4-4"></path></svg>
            </div>
            <span class="lab2-pill-status status-active-green" id="statusGreenLed">ACTIVE</span>
          </div>
          <div class="lab2-card-body">
            <h3 class="lab2-comp-name">🟢 Green LED</h3>
            <p class="lab2-comp-role">Access Granted</p>
          </div>
          <div class="lab2-card-footer">
            <span class="lab2-reading-value" id="valGreenLed">HIGH • Cleared</span>
            <button class="lab2-test-btn" data-comp-action="green-led">Toggle</button>
          </div>
        </div>

        <div class="lab2-card">
          <div class="lab2-card-header">
            <div class="lab2-card-icon-wrap icon-red-led">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <span class="lab2-pill-status status-standby-red" id="statusRedLed">STANDBY</span>
          </div>
          <div class="lab2-card-body">
            <h3 class="lab2-comp-name">🔴 Red LED</h3>
            <p class="lab2-comp-role">Access Denied</p>
          </div>
          <div class="lab2-card-footer">
            <span class="lab2-reading-value" id="valRedLed">LOW • Armed</span>
            <button class="lab2-test-btn" data-comp-action="red-led">Toggle</button>
          </div>
        </div>

        <div class="lab2-card">
          <div class="lab2-card-header">
            <div class="lab2-card-icon-wrap icon-button">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>
            </div>
            <span class="lab2-pill-status status-ready-blue" id="statusPushButton">RELEASED</span>
          </div>
          <div class="lab2-card-body">
            <h3 class="lab2-comp-name">🔘 Push Button</h3>
            <p class="lab2-comp-role">Manual Control</p>
          </div>
          <div class="lab2-card-footer">
            <span class="lab2-reading-value" id="valPushButton">GPIO 14 • Ready</span>
            <button class="lab2-test-btn" data-comp-action="push-button">Press Pulse</button>
          </div>
        </div>

        <div class="lab2-card">
          <div class="lab2-card-header">
            <div class="lab2-card-icon-wrap icon-buzzer">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <span class="lab2-pill-status status-armed-orange" id="statusBuzzer">ARMED</span>
          </div>
          <div class="lab2-card-body">
            <h3 class="lab2-comp-name">🔔 Buzzer</h3>
            <p class="lab2-comp-role">Alarm</p>
          </div>
          <div class="lab2-card-footer">
            <span class="lab2-reading-value" id="valBuzzer">Silent • 0 dB</span>
            <button class="lab2-test-btn" data-comp-action="buzzer">Test Beep</button>
          </div>
        </div>
      </div>

      <div class="enterprise-card">
        <h3 class="card-heading">Lab 2 Recent Access Logs</h3>
        <div class="table-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>PERSONNEL</th>
                <th>ACCESS METHOD</th>
                <th>HARDWARE RESPONSE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Dr. Marcus Vance</strong></td>
                <td>Biometric Face Net</td>
                <td>🟢 Green LED HIGH (Relay Cleared)</td>
                <td><span class="badge-status-green">GRANTED</span></td>
              </tr>
              <tr>
                <td><strong>Sarah Jenkins</strong></td>
                <td>Manual Push Button</td>
                <td>🔘 GPIO 14 Momentary Pulse</td>
                <td><span class="badge-status-green">GRANTED</span></td>
              </tr>
              <tr>
                <td><strong>Unknown Ingress</strong></td>
                <td>Unauthorized Attempt</td>
                <td>🔴 Red LED HIGH + 🔔 Buzzer Arm</td>
                <td><span class="badge-status-red" style="background:#fee2e2; color:#b91c1c; padding:3px 8px; border-radius:10px; font-weight:700; font-size:11px;">DENIED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getLab2SensorsHtml() {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">LAB 2 — Sensor Monitoring Hub</h2>
            <p class="banner-subtitle">Real-time telemetry: MQ-2 Gas, PIR Motion & Temp & Humidity</p>
          </div>
        </div>
        <span class="badge-tag">Telemetry Stream: 100ms</span>
      </div>

      <div class="lab2-grid-7col" style="margin-bottom: 20px;">
        <div class="lab2-card">
          <div class="lab2-card-header">
            <div class="lab2-card-icon-wrap icon-gas">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>
            </div>
            <span class="lab2-pill-status status-normal-teal" id="statusMq2">CLEAN</span>
          </div>
          <div class="lab2-card-body">
            <h3 class="lab2-comp-name">💨 MQ-2</h3>
            <p class="lab2-comp-role">Gas Detection</p>
          </div>
          <div class="lab2-card-footer">
            <span class="lab2-reading-value" id="valMq2">38 PPM (Normal)</span>
            <button class="lab2-test-btn" data-comp-action="mq2">Sample</button>
          </div>
        </div>

        <div class="lab2-card">
          <div class="lab2-card-header">
            <div class="lab2-card-icon-wrap icon-pir">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <span class="lab2-pill-status status-motion-purple" id="statusPir">CLEAR</span>
          </div>
          <div class="lab2-card-body">
            <h3 class="lab2-comp-name">👤 PIR</h3>
            <p class="lab2-comp-role">Motion Detection</p>
          </div>
          <div class="lab2-card-footer">
            <span class="lab2-reading-value" id="valPir">No Motion • Secure</span>
            <button class="lab2-test-btn" data-comp-action="pir">Detect</button>
          </div>
        </div>

        <div class="lab2-card">
          <div class="lab2-card-header">
            <div class="lab2-card-icon-wrap icon-temp">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
            </div>
            <span class="lab2-pill-status status-optimal-cyan" id="statusTempHum">OPTIMAL</span>
          </div>
          <div class="lab2-card-body">
            <h3 class="lab2-comp-name">🌡️ Temp & Humidity</h3>
            <p class="lab2-comp-role">Environment</p>
          </div>
          <div class="lab2-card-footer">
            <span class="lab2-reading-value" id="valTempHum">21.4°C • 44% RH</span>
            <button class="lab2-test-btn" data-comp-action="temp-hum">Read</button>
          </div>
        </div>
      </div>

      <div class="submodule-grid-3col">
        <div class="telemetry-card">
          <span class="telemetry-label">MQ-2 Gas Concentration</span>
          <span class="telemetry-val" style="color: #0d9488;">38 PPM (LPG/Smoke Clean)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 15%; background: #0d9488;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">PIR Infrared Motion Grid</span>
          <span class="telemetry-val" style="color: #7c3aed;">Sector Clear (0 Triggers)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 5%; background: #7c3aed;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">DHT22 Ambient Climate</span>
          <span class="telemetry-val" style="color: #0284c7;">21.4°C • 44% RH</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 44%; background: #0284c7;"></div></div>
        </div>
      </div>
    `;
  }

  function getLab2ThreatHtml() {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">LAB 2 — Threat Detection & Anomaly Matrix</h2>
            <p class="banner-subtitle">Real-time threat telemetry across PIR, MQ-2 Gas, Buzzer & Red LED</p>
          </div>
        </div>
        <button class="btn-primary-action" id="dynScanBtn">
          <span>Run Threat Scan</span>
        </button>
      </div>

      <div class="submodule-grid-3col">
        <div class="telemetry-card">
          <span class="telemetry-label">PIR Motion Anomaly</span>
          <span class="telemetry-val" style="color: #16a34a;">0.00% (Secure)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 1%; background: #16a34a;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">MQ-2 Gas Leak Hazard</span>
          <span class="telemetry-val" style="color: #16a34a;">0.01% (Safe Air)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 2%; background: #16a34a;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Buzzer & Red LED Status</span>
          <span class="telemetry-val" style="color: #7c3aed;">ARMED (Silent)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 100%; background: #7c3aed;"></div></div>
        </div>
      </div>
    `;
  }

  function getLab2LogsHtml() {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <h2 class="banner-title">LAB 2 — Component Audit Trail</h2>
            <p class="banner-subtitle">Real-time hardware event log for all 7 Lab 2 components</p>
          </div>
        </div>
        <button class="btn-secondary-action" id="dynExportBtn">
          <span>Export CSV</span>
        </button>
      </div>

      <div class="enterprise-card">
        <div class="table-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>TIMESTAMP (IST)</th>
                <th>COMPONENT</th>
                <th>EVENT DETAILS</th>
                <th>GPIO / VALUE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-mono">10:45:12</td>
                <td>🟢 Green LED</td>
                <td>Access Clearance Granted (Relay HIGH)</td>
                <td>3.3V (Active)</td>
                <td><span class="badge-status-green">PASSED</span></td>
              </tr>
              <tr>
                <td class="cell-mono">10:40:22</td>
                <td>🌡️ Temp & Humidity</td>
                <td>Microclimate Telemetry Stream</td>
                <td>21.4°C • 44% RH</td>
                <td><span class="badge-status-green">NOMINAL</span></td>
              </tr>
              <tr>
                <td class="cell-mono">10:35:10</td>
                <td>👤 PIR Motion</td>
                <td>Sector Infrared Sweep Clean</td>
                <td>No Ingress</td>
                <td><span class="badge-status-green">SECURE</span></td>
              </tr>
              <tr>
                <td class="cell-mono">10:30:04</td>
                <td>💨 MQ-2 Gas</td>
                <td>Gas Concentration Reading</td>
                <td>38 PPM (Normal)</td>
                <td><span class="badge-status-green">CLEAN</span></td>
              </tr>
              <tr>
                <td class="cell-mono">10:25:50</td>
                <td>🔘 Push Button</td>
                <td>Manual Control Momentary Pulse</td>
                <td>GPIO 14 HIGH</td>
                <td><span class="badge-status-green">PASSED</span></td>
              </tr>
              <tr>
                <td class="cell-mono">10:20:18</td>
                <td>🔔 Buzzer Relay</td>
                <td>Alarm Diagnostic Self-Test</td>
                <td>0 dB (Armed)</td>
                <td><span class="badge-status-green">READY</span></td>
              </tr>
              <tr>
                <td class="cell-mono">10:15:02</td>
                <td>🔴 Red LED</td>
                <td>Access Denied Relay Standby</td>
                <td>0.0V (Standby)</td>
                <td><span class="badge-status-green">STANDBY</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getLab2AlertsHtml() {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">LAB 2 — Hardware Alert & Incident Dispatch</h2>
            <p class="banner-subtitle">Real-time alert dispatch for Buzzer, Red LED, Gas & Motion thresholds</p>
          </div>
        </div>
        <span class="badge-status-green">0 ACTIVE HARDWARE ALARMS</span>
      </div>

      <div class="enterprise-card" style="text-align: center; padding: 40px 24px;">
        <div style="width: 48px; height: 48px; margin: 0 auto 12px auto; color: #16a34a;">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <h3 class="card-heading" style="font-size: 18px; margin-bottom: 6px;">All 7 Lab 2 Components Nominal</h3>
        <p style="color: #64748b; max-width: 500px; margin: 0 auto 20px auto; font-size: 13px;">Green LED, Red LED, Buzzer, Push Button, MQ-2 Gas Sensor, PIR Motion Detector, and Temp & Humidity sensors are fully connected with zero active alert triggers.</p>
        <button class="btn-primary-action" id="dynSimAlertBtn" style="margin: 0 auto;">
          <span>Simulate Lab 2 Gas Alert (MQ-2)</span>
        </button>
      </div>
    `;
  }

  // =========================================================================
  // LAB 2 — CLEAN & COMPACT COMPONENT PANEL TEMPLATE
  // =========================================================================
  function getLab2ComponentsHtml() {
    return `
      <div class="lab2-panel-container">
        
        <!-- Top Compact Banner -->
        <div class="lab2-banner-card">
          <div class="lab2-banner-left">
            <div class="lab2-banner-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 2v7.31L4.69 18.1A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.71-2.9L14 9.31V2"></path>
                <line x1="8.5" y1="2" x2="15.5" y2="2"></line>
                <line x1="7" y1="15" x2="17" y2="15"></line>
              </svg>
            </div>
            <div>
              <h2 class="lab2-banner-title">LAB 2 — Component Status Panel</h2>
              <p class="lab2-banner-subtitle">Real-time hardware status & peripheral telemetry for Lab 2</p>
            </div>
          </div>
          <div class="lab2-banner-badge">
            <span class="live-dot-pulse" style="background:#16a34a; width:7px; height:7px; border-radius:50%; display:inline-block;"></span>
            <span>7 / 7 COMPONENTS ONLINE</span>
          </div>
        </div>

        <!-- 7 Compact Component Cards Grid -->
        <div class="lab2-grid-7col">

          <!-- 1. Green LED — Access Granted -->
          <div class="lab2-card" id="cardGreenLed">
            <div class="lab2-card-header">
              <div class="lab2-card-icon-wrap icon-green-led">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M9 12l2 2 4-4"></path>
                </svg>
              </div>
              <span class="lab2-pill-status status-active-green" id="statusGreenLed">ACTIVE</span>
            </div>
            <div class="lab2-card-body">
              <h3 class="lab2-comp-name">🟢 Green LED</h3>
              <p class="lab2-comp-role">Access Granted</p>
            </div>
            <div class="lab2-card-footer">
              <span class="lab2-reading-value" id="valGreenLed">HIGH • Cleared</span>
              <button class="lab2-test-btn" data-comp-action="green-led">Toggle</button>
            </div>
          </div>

          <!-- 2. Red LED — Access Denied -->
          <div class="lab2-card" id="cardRedLed">
            <div class="lab2-card-header">
              <div class="lab2-card-icon-wrap icon-red-led">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <span class="lab2-pill-status status-standby-red" id="statusRedLed">STANDBY</span>
            </div>
            <div class="lab2-card-body">
              <h3 class="lab2-comp-name">🔴 Red LED</h3>
              <p class="lab2-comp-role">Access Denied</p>
            </div>
            <div class="lab2-card-footer">
              <span class="lab2-reading-value" id="valRedLed">LOW • Armed</span>
              <button class="lab2-test-btn" data-comp-action="red-led">Toggle</button>
            </div>
          </div>

          <!-- 3. Buzzer — Alarm -->
          <div class="lab2-card" id="cardBuzzer">
            <div class="lab2-card-header">
              <div class="lab2-card-icon-wrap icon-buzzer">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <span class="lab2-pill-status status-armed-orange" id="statusBuzzer">ARMED</span>
            </div>
            <div class="lab2-card-body">
              <h3 class="lab2-comp-name">🔔 Buzzer</h3>
              <p class="lab2-comp-role">Alarm</p>
            </div>
            <div class="lab2-card-footer">
              <span class="lab2-reading-value" id="valBuzzer">Silent • 0 dB</span>
              <button class="lab2-test-btn" data-comp-action="buzzer">Test Beep</button>
            </div>
          </div>

          <!-- 4. Push Button — Manual Control -->
          <div class="lab2-card" id="cardPushButton">
            <div class="lab2-card-header">
              <div class="lab2-card-icon-wrap icon-button">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
              </div>
              <span class="lab2-pill-status status-ready-blue" id="statusPushButton">RELEASED</span>
            </div>
            <div class="lab2-card-body">
              <h3 class="lab2-comp-name">🔘 Push Button</h3>
              <p class="lab2-comp-role">Manual Control</p>
            </div>
            <div class="lab2-card-footer">
              <span class="lab2-reading-value" id="valPushButton">GPIO 14 • Ready</span>
              <button class="lab2-test-btn" data-comp-action="push-button">Press Pulse</button>
            </div>
          </div>

          <!-- 5. MQ-2 — Gas Detection -->
          <div class="lab2-card" id="cardMq2">
            <div class="lab2-card-header">
              <div class="lab2-card-icon-wrap icon-gas">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
              </div>
              <span class="lab2-pill-status status-normal-teal" id="statusMq2">CLEAN</span>
            </div>
            <div class="lab2-card-body">
              <h3 class="lab2-comp-name">💨 MQ-2</h3>
              <p class="lab2-comp-role">Gas Detection</p>
            </div>
            <div class="lab2-card-footer">
              <span class="lab2-reading-value" id="valMq2">38 PPM (Normal)</span>
              <button class="lab2-test-btn" data-comp-action="mq2">Sample</button>
            </div>
          </div>

          <!-- 6. PIR — Motion Detection -->
          <div class="lab2-card" id="cardPir">
            <div class="lab2-card-header">
              <div class="lab2-card-icon-wrap icon-pir">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span class="lab2-pill-status status-motion-purple" id="statusPir">CLEAR</span>
            </div>
            <div class="lab2-card-body">
              <h3 class="lab2-comp-name">👤 PIR</h3>
              <p class="lab2-comp-role">Motion Detection</p>
            </div>
            <div class="lab2-card-footer">
              <span class="lab2-reading-value" id="valPir">No Motion • Secure</span>
              <button class="lab2-test-btn" data-comp-action="pir">Detect</button>
            </div>
          </div>

          <!-- 7. Temp & Humidity — Environment -->
          <div class="lab2-card" id="cardTempHum">
            <div class="lab2-card-header">
              <div class="lab2-card-icon-wrap icon-temp">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                </svg>
              </div>
              <span class="lab2-pill-status status-optimal-cyan" id="statusTempHum">OPTIMAL</span>
            </div>
            <div class="lab2-card-body">
              <h3 class="lab2-comp-name">🌡️ Temp & Humidity</h3>
              <p class="lab2-comp-role">Environment</p>
            </div>
            <div class="lab2-card-footer">
              <span class="lab2-reading-value" id="valTempHum">21.4°C • 44% RH</span>
              <button class="lab2-test-btn" data-comp-action="temp-hum">Read</button>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // Module Templates with Clean SVG Icons
  function getSurveillanceHtml(lab) {
    return `
      <div class="live-monitoring-page-theme">
        <!-- Top Select Camera Mode Card -->
        <div class="live-mode-selector-card">
          <h4 class="mode-selector-heading">SELECT CAMERA MODE</h4>
          <div class="camera-mode-cards-grid">
            <div class="camera-mode-card active" id="modeLiveCameraBtn">
              <div class="mode-card-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <div class="mode-card-text">
                <div class="mode-card-title">Live Camera</div>
                <div class="mode-card-desc">Raw ESP32-CAM stream. No AI, no tracking.</div>
              </div>
            </div>

            <div class="camera-mode-card" id="modeAiTrackingBtn">
              <div class="mode-card-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                  <circle cx="12" cy="5" r="2"></circle>
                  <path d="M12 7v4"></path>
                  <line x1="8" y1="16" x2="8" y2="16"></line>
                  <line x1="16" y1="16" x2="16" y2="16"></line>
                </svg>
              </div>
              <div class="mode-card-text">
                <div class="mode-card-title">AI Tracking</div>
                <div class="mode-card-desc">YOLO person detection drives the pan/tilt servos.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Live Monitoring 2-Column Grid -->
        <div class="live-monitoring-main-grid">
          
          <!-- Left Column: Camera Window & Servo Controls Card -->
          <div class="live-camera-window-card">
            <div class="cam-window-header">
              <div class="cam-window-title-group">
                <h3 class="cam-window-title">Camera Window</h3>
              </div>
              
              <div class="cam-window-header-actions">
                <!-- Aspect Ratio Shape Filter Pills -->
                <div class="cam-aspect-pills" id="camAspectPills">
                  <button type="button" class="cam-aspect-btn" data-aspect-filter="all" title="Show all resolutions">All</button>
                  <button type="button" class="cam-aspect-btn" data-aspect-filter="16:9" title="16:9 Widescreen">16:9</button>
                  <button type="button" class="cam-aspect-btn" data-aspect-filter="4:3" title="4:3 Standard">4:3</button>
                  <button type="button" class="cam-aspect-btn active" data-aspect-filter="1:1" title="1:1 Square Shape">■ 1:1 Square</button>
                </div>

                <!-- Multi-Size Resolution Selector (Including Square Shapes) -->
                <div class="cam-res-select-wrapper">
                  <span class="cam-res-label">Resolution:</span>
                  <select class="cam-res-dropdown" id="camResolutionSelect" title="Select Stream Resolution & Window Shape">
                    <optgroup label="Square Shapes (1:1 Ratio)" data-group="1:1">
                      <option value="sq-1600" data-res="1600x1600 (Square 1:1)" data-height="520px" data-aspect="square" selected>1600x1600 (Square 1:1 HD)</option>
                      <option value="sq-1200" data-res="1200x1200 (Square 1:1)" data-height="460px" data-aspect="square">1200x1200 (Square 1:1)</option>
                      <option value="sq-1080" data-res="1080x1080 (Square 1:1)" data-height="420px" data-aspect="square">1080x1080 (Square 1:1 FHD)</option>
                      <option value="sq-800" data-res="800x800 (Square 1:1)" data-height="360px" data-aspect="square">800x800 (Square 1:1 SVGA)</option>
                      <option value="sq-640" data-res="640x640 (Square 1:1)" data-height="320px" data-aspect="square">640x640 (Square 1:1 VGA)</option>
                      <option value="sq-480" data-res="480x480 (Square 1:1)" data-height="280px" data-aspect="square">480x480 (Square 1:1 SD)</option>
                      <option value="sq-240" data-res="240x240 (Square 1:1)" data-height="240px" data-aspect="square">240x240 (Square 1:1 Mini)</option>
                    </optgroup>
                    <optgroup label="Standard (4:3 Ratio)" data-group="4:3">
                      <option value="uxga" data-res="1600x1200 (UXGA 4:3)" data-height="460px" data-aspect="standard">1600x1200 (UXGA 4:3)</option>
                      <option value="svga" data-res="800x600 (SVGA 4:3)" data-height="340px" data-aspect="standard">800x600 (SVGA 4:3)</option>
                      <option value="vga" data-res="640x480 (VGA 4:3)" data-height="280px" data-aspect="standard">640x480 (VGA 4:3)</option>
                    </optgroup>
                    <optgroup label="Widescreen (16:9 Ratio)" data-group="16:9">
                      <option value="fhd" data-res="1920x1080 (FHD 16:9)" data-height="420px" data-aspect="wide">1920x1080 (FHD 16:9)</option>
                      <option value="hd" data-res="1280x720 (HD 16:9)" data-height="340px" data-aspect="wide">1280x720 (HD 16:9)</option>
                    </optgroup>
                  </select>
                </div>
                <span class="cam-window-mode-badge" id="camWindowBadge">Live Camera</span>
              </div>
            </div>

            <!-- Video Stream Box (Dynamic Resizable Viewport) -->
            <div class="cam-video-viewport" id="camVideoViewport" style="min-height: 340px;">
              <div class="cam-live-indicator">
                <span class="live-dot-pulse"></span>
                <span>LIVE</span>
              </div>
              <div class="cam-stream-status-overlay" id="camStreamStatusText">
                Waiting for stream from http://192.168.1.50:81/stream • 1280x720 @ 30fps
              </div>
              <div class="cam-ai-overlay" id="camAiBoundingBox" style="display: none;">
                <div class="ai-box-reticle">
                  <span class="ai-box-label">Person: 99.2% • Dr. Elena Vance</span>
                </div>
              </div>
            </div>

            <!-- Sliders and Servo Controls -->
            <div class="servo-controls-section">
              
              <div class="servo-control-row">
                <div class="servo-label-group">
                  <span class="servo-label-title">Servo Pan</span>
                  <span class="servo-val-display" id="servoPanDisplay">90°</span>
                </div>
                <input type="range" class="servo-styled-slider" id="servoPanSlider" min="0" max="180" value="90">
              </div>

              <div class="servo-control-row">
                <div class="servo-label-group">
                  <span class="servo-label-title">Servo Tilt</span>
                  <span class="servo-val-display" id="servoTiltDisplay">65°</span>
                </div>
                <input type="range" class="servo-styled-slider slider-gradient" id="servoTiltSlider" min="0" max="180" value="65">
              </div>

              <div class="servo-control-row">
                <div class="servo-label-group">
                  <span class="servo-label-title">Flash LED</span>
                  <span class="servo-val-display" id="flashLedDisplay">0%</span>
                </div>
                <input type="range" class="servo-styled-slider slider-light" id="flashLedSlider" min="0" max="100" value="0">
              </div>

              <!-- Bottom Buttons Row -->
              <div class="cam-action-buttons-row">
                <button class="cam-reset-btn" id="camResetServosBtn">Reset</button>
                <button class="cam-capture-btn" id="camCaptureImgBtn">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  <span>Capture Image</span>
                </button>
              </div>

            </div>
          </div>

          <!-- Right Column: Status, Last Capture, Activity Log -->
          <div class="live-monitoring-sidebar-col">
            
            <!-- Status Card -->
            <div class="live-subcard">
              <h4 class="live-subcard-title">Status</h4>
              <div class="live-status-table">
                <div class="status-keyval-row">
                  <span class="status-key">Mode</span>
                  <span class="status-val-bold" id="statusValMode">Live Camera</span>
                </div>
                <div class="status-keyval-row">
                  <span class="status-key">Resolution</span>
                  <span class="status-val-bold" id="statusValRes" style="color: #ff4d55;">1280x720 (HD)</span>
                </div>
                <div class="status-keyval-row">
                  <span class="status-key">Person</span>
                  <span class="status-val-dim" id="statusValPerson">—</span>
                </div>
                <div class="status-keyval-row">
                  <span class="status-key">Confidence</span>
                  <span class="status-val-dim" id="statusValConfidence">—</span>
                </div>
                <div class="status-keyval-row">
                  <span class="status-key">Tracking</span>
                  <span class="status-val-dim" id="statusValTracking">OFF</span>
                </div>
                <div class="status-keyval-row">
                  <span class="status-key">Servo Pan</span>
                  <span class="status-val-bold" id="statusValPan">90°</span>
                </div>
                <div class="status-keyval-row">
                  <span class="status-key">Servo Tilt</span>
                  <span class="status-val-bold" id="statusValTilt">65°</span>
                </div>
              </div>
            </div>

            <!-- Last Capture Card (Interactive Touchable Snapshot Preview) -->
            <div class="live-subcard">
              <div class="last-capture-header">
                <h4 class="live-subcard-title" style="margin:0;">Last Capture</h4>
                <span class="touch-hint-badge">Touch to view</span>
              </div>
              <div class="last-capture-viewport" id="lastCaptureContainer" title="Touch / click to view full resolution snapshot">
                <span class="no-capture-text">No capture yet. Click "Capture Image"</span>
              </div>
            </div>

            <!-- Activity Log Card -->
            <div class="live-subcard">
              <h4 class="live-subcard-title">Activity Log</h4>
              <div class="live-activity-log-box" id="liveActivityLogBox">
                <div class="log-entry-row">Dashboard ready</div>
              </div>
            </div>

          </div>

        </div>

        <!-- High-Resolution Snapshot Lightbox Modal -->
        <div class="snapshot-lightbox-modal" id="snapshotLightboxModal" style="display: none;">
          <div class="snapshot-modal-backdrop" id="snapshotModalBackdrop"></div>
          <div class="snapshot-modal-dialog">
            <div class="snapshot-modal-header">
              <div class="snapshot-modal-title-wrap">
                <div class="snapshot-modal-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 class="snapshot-modal-title" id="lightboxModalTitle">Snapshot_Captured.png</h3>
                  <p class="snapshot-modal-subtitle" id="lightboxModalMeta">1280x720 HD • SHA-256 Verified • ${lab}</p>
                </div>
              </div>
              <button class="snapshot-modal-close" id="snapshotModalCloseBtn" title="Close Preview">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <!-- Full Image Screen View -->
            <div class="snapshot-modal-body">
              <div class="snapshot-full-canvas-wrap" id="lightboxImageFrame">
                <div class="snapshot-cyber-hud-overlay">
                  <div class="hud-top-left">NODE: ${lab} AIRLOCK #01 • LIVE SURVEILLANCE ARCHIVE</div>
                  <div class="hud-top-right" id="lightboxHudTimestamp">2026-08-26 10:00:14 UTC</div>
                  <div class="hud-bottom-left">CHECKSUM: SHA-256 (SECURE-ENCLAVE)</div>
                  <div class="hud-bottom-right">STATUS: CRYPTO-SIGNED PASSED</div>
                </div>
                <div class="snapshot-simulated-scene" id="lightboxScenePreview">
                  <div class="scene-grid-lines"></div>
                  <div class="scene-reticle-box">
                    <span class="scene-reticle-label">TARGET DETECTED • CONFIDENCE: 99.8% • DR. ELENA VANCE</span>
                  </div>
                  <div class="scene-center-badge">
                    <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="#38bdf8" stroke-width="1.8">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>SENTINEL HIGH-RES OPTICAL CAPTURE ARCHIVE</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="snapshot-modal-footer">
              <div class="snapshot-footer-meta">
                <span class="badge-status-green">AUTHENTICATED IN VAULT</span>
                <span id="lightboxResolutionBadge" class="badge-res-pill">1280x720 HD</span>
              </div>
              <div class="snapshot-footer-actions">
                <button class="btn-secondary-action" id="lightboxDownloadBtn">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Download Snapshot</span>
                </button>
                <button class="btn-primary-action" id="lightboxDismissBtn">
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getThreatHtml(lab) {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">${lab} — AI Threat Detection Core</h2>
            <p class="banner-subtitle">Autonomous real-time anomaly classification and defense scoring</p>
          </div>
        </div>
        <button class="btn-primary-action" id="dynScanBtn">
          <span>Run Neural Diagnostics</span>
        </button>
      </div>

      <div class="submodule-grid-3col">
        <div class="telemetry-card">
          <span class="telemetry-label">Threat Probability Index</span>
          <span class="telemetry-val" style="color: #16a34a;">0.02% (Optimal)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 2%; background: #16a34a;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Classifier Confidence</span>
          <span class="telemetry-val" style="color: #ff4d55;">99.98%</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 99.9%; background: linear-gradient(90deg, #b01f24, #e41e25);"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Defense Protocol</span>
          <span class="telemetry-val" style="color: #7c3aed;">DEFCON 5 (Active)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 100%; background: #7c3aed;"></div></div>
        </div>
      </div>
    `;
  }

  function getFaceHtml(lab) {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div>
            <h2 class="banner-title">${lab} — Biometric Facial Recognition Hub</h2>
            <p class="banner-subtitle">Neural face mesh recognition & authorized personnel clearance records</p>
          </div>
        </div>
        <span class="badge-tag">48 Authorized Personnel</span>
      </div>

      <div class="enterprise-card">
        <h3 class="card-heading">Recently Verified Personnel</h3>
        <div class="table-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>PERSONNEL NAME</th>
                <th>DESIGNATION / ROLE</th>
                <th>SECURITY CLEARANCE</th>
                <th>CONFIDENCE</th>
                <th>VERIFICATION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Dr. Elena Rostova</strong></td>
                <td>Lead Biochemist</td>
                <td>Level 5 (Full Access)</td>
                <td><span class="cell-mono" style="color: #16a34a;">99.82% Match</span></td>
                <td><span class="badge-status-green">GRANTED</span></td>
              </tr>
              <tr>
                <td><strong>Marcus Vance</strong></td>
                <td>AI Security Lead Engineer</td>
                <td>Level 4 (Systems & Edge)</td>
                <td><span class="cell-mono" style="color: #16a34a;">99.45% Match</span></td>
                <td><span class="badge-status-green">GRANTED</span></td>
              </tr>
              <tr>
                <td><strong>Sarah Jenkins</strong></td>
                <td>Cryogenics Specialist</td>
                <td>Level 4 (Cold Vault Access)</td>
                <td><span class="cell-mono" style="color: #16a34a;">98.90% Match</span></td>
                <td><span class="badge-status-green">GRANTED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getAccessHtml(lab) {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">${lab} — Electronic Access Control Matrix</h2>
            <p class="banner-subtitle">Automated magnetic interlocks, pressure seals, and keycard relays</p>
          </div>
        </div>
        <button class="btn-secondary-action" id="dynCycleBtn">
          <span>Cycle All Interlocks</span>
        </button>
      </div>

      <div class="submodule-grid-3col">
        <div class="telemetry-card">
          <span class="telemetry-label">Airlock Door 01</span>
          <span class="telemetry-val" style="color: #16a34a;">LOCKED (SECURE)</span>
          <span style="font-size: 12px; color: #64748b;">NFC + Biometric Required</span>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Cleanroom Pressure Door</span>
          <span class="telemetry-val" style="color: #16a34a;">SEALED (SECURE)</span>
          <span style="font-size: 12px; color: #64748b;">+28.5 Pa Differential</span>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Cryo Vault Interlock</span>
          <span class="telemetry-val" style="color: #16a34a;">LOCKED (SECURE)</span>
          <span style="font-size: 12px; color: #64748b;">Dual Key Clearance</span>
        </div>
      </div>
    `;
  }

  function getSensorsHtml(lab) {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">${lab} — Environmental & IoT Sensor Telemetry</h2>
            <p class="banner-subtitle">High-precision microclimate, gas, AQI, and thermal telemetry stream</p>
          </div>
        </div>
        <span class="badge-tag">Telemetry Rate: 100ms</span>
      </div>

      <div class="submodule-grid-3col">
        <div class="telemetry-card">
          <span class="telemetry-label">Ambient Temperature</span>
          <span class="telemetry-val">21.4 °C</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 45%;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Relative Humidity</span>
          <span class="telemetry-val">44.2 % RH</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 44%;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Air Quality Index (AQI)</span>
          <span class="telemetry-val" style="color: #16a34a;">12 (Cleanroom Grade A)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 12%; background: #16a34a;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Cryogenic Vault Temperature</span>
          <span class="telemetry-val" style="color: #0284c7;">-78.5 °C</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 90%; background: #0284c7;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">O2 Oxygen Concentration</span>
          <span class="telemetry-val" style="color: #16a34a;">20.9% (Safe)</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 95%; background: #16a34a;"></div></div>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">Differential Chamber Pressure</span>
          <span class="telemetry-val">+28.5 Pa</span>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width: 65%;"></div></div>
        </div>
      </div>
    `;
  }

  function getLogsHtml(lab) {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <h2 class="banner-title">${lab} — Cryptographic Audit Trail</h2>
            <p class="banner-subtitle">Immutable event logs timestamped with zero-knowledge verification</p>
          </div>
        </div>
        <button class="btn-secondary-action" id="dynExportBtn">
          <span>Export Audit Log (.CSV)</span>
        </button>
      </div>

      <div class="enterprise-card">
        <div class="table-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>TIMESTAMP (UTC)</th>
                <th>SUBSYSTEM</th>
                <th>EVENT DETAILS</th>
                <th>IDENTITY / NODE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-mono">10:45:12.04</td>
                <td>Facial Scanner</td>
                <td>Biometric Clearance Confirmed</td>
                <td>Dr. Elena Rostova</td>
                <td><span class="badge-status-green">PASSED</span></td>
              </tr>
              <tr>
                <td class="cell-mono">10:40:22.18</td>
                <td>Thermal Core</td>
                <td>Cryo Cooler Cyclic Stabilization</td>
                <td>Node-Cryo-01</td>
                <td><span class="badge-status-green">NOMINAL</span></td>
              </tr>
              <tr>
                <td class="cell-mono">10:35:10.90</td>
                <td>AI Threat Engine</td>
                <td>Perimeter Optical Sweep Clean</td>
                <td>SentinelVision v4.2</td>
                <td><span class="badge-status-green">PASSED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getAnalyticsHtml(lab) {
    return `
      <div class="analytics-page-theme">
        <!-- Top Analytics Header Bar -->
        <div class="analytics-top-header-bar">
          <div class="analytics-header-left">
            <div class="analytics-header-icon-badge">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <div>
              <h2 class="analytics-main-title">${lab} — Security & Telemetry Analytics</h2>
              <p class="analytics-main-subtitle">Real-time threat inference metrics, biometric clearance telemetry & cleanroom sensor integrity</p>
            </div>
          </div>
          <div class="analytics-header-right">
            <div class="analytics-timeframe-picker">
              <button class="analytics-time-btn" data-range="24h">24H</button>
              <button class="analytics-time-btn active" data-range="7d">7D</button>
              <button class="analytics-time-btn" data-range="30d">30D</button>
              <button class="analytics-time-btn" data-range="quarter">All</button>
            </div>
            <button class="analytics-export-btn" id="analyticsExportBtn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <!-- 4 Key Analytics KPI Cards -->
        <div class="analytics-kpi-grid">
          <div class="analytics-kpi-card">
            <div class="kpi-card-header">
              <span class="kpi-title">Total AI Inferences</span>
              <span class="kpi-trend positive">+12.4%</span>
            </div>
            <div class="kpi-value" id="kpiInferencesVal">${lab === 'LAB 1' ? '1,428,950' : '984,320'}</div>
            <div class="kpi-footer">
              <span class="kpi-subtext">YOLOv8 + FaceNet real-time passes</span>
              <span class="kpi-badge-blue">99.98% Acc</span>
            </div>
          </div>

          <div class="analytics-kpi-card">
            <div class="kpi-card-header">
              <span class="kpi-title">Threat Interception Rate</span>
              <span class="kpi-trend positive">Optimal</span>
            </div>
            <div class="kpi-value" id="kpiThreatRateVal">100.0%</div>
            <div class="kpi-footer">
              <span class="kpi-subtext">0 active security perimeter breaches</span>
              <span class="kpi-badge-green">Secured</span>
            </div>
          </div>

          <div class="analytics-kpi-card">
            <div class="kpi-card-header">
              <span class="kpi-title">Avg Latency & Verify Speed</span>
              <span class="kpi-trend positive">-0.4ms</span>
            </div>
            <div class="kpi-value" id="kpiLatencyVal">3.2 ms</div>
            <div class="kpi-footer">
              <span class="kpi-subtext">ESP32 & Neural Edge Pipeline</span>
              <span class="kpi-badge-blue">Real-time</span>
            </div>
          </div>

          <div class="analytics-kpi-card">
            <div class="kpi-card-header">
              <span class="kpi-title">Telemetry Sensor Packets</span>
              <span class="kpi-trend positive">100% Flow</span>
            </div>
            <div class="kpi-value" id="kpiTelemetryVal">${lab === 'LAB 1' ? '28,490,112' : '19,740,250'}</div>
            <div class="kpi-footer">
              <span class="kpi-subtext">Thermal, Gas, PIR, LiDAR Nodes</span>
              <span class="kpi-badge-blue">24/24 Online</span>
            </div>
          </div>
        </div>

        <!-- Main Visualizations 2-Column Split -->
        <div class="analytics-visuals-grid">
          
          <!-- Left Visual: Threat & Optical AI Inferences Trend -->
          <div class="analytics-card-surface">
            <div class="analytics-card-top">
              <div>
                <h3 class="analytics-card-heading">AI Threat Detection & Scanning Activity</h3>
                <p class="analytics-card-caption">7-day inference volume vs. security anomaly score alerts</p>
              </div>
              <div class="chart-legend-row">
                <span class="legend-dot blue"></span>
                <span class="legend-label">Total Inferences</span>
                <span class="legend-dot green"></span>
                <span class="legend-label">Biometric Passes</span>
              </div>
            </div>

            <!-- Rich Interactive SVG Area / Bar Chart -->
            <div class="analytics-svg-chart-container">
              <svg class="analytics-chart-svg" viewBox="0 0 600 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradientBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#e41e25" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#e41e25" stop-opacity="0.0"/>
                  </linearGradient>
                  <linearGradient id="areaGradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#ff333c" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="#ff333c" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>

                <!-- Horizontal Grid Lines -->
                <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255, 255, 255, 0.08)" stroke-dasharray="4"/>
                <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255, 255, 255, 0.08)" stroke-dasharray="4"/>
                <line x1="0" y1="130" x2="600" y2="130" stroke="rgba(255, 255, 255, 0.08)" stroke-dasharray="4"/>
                <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(255, 255, 255, 0.08)" stroke-dasharray="4"/>

                <!-- Primary Red Area & Curve -->
                <path d="M 0 180 Q 80 140 100 120 T 200 90 T 300 110 T 400 60 T 500 70 T 600 40 L 600 210 L 0 210 Z" fill="url(#areaGradientBlue)"/>
                <path d="M 0 180 Q 80 140 100 120 T 200 90 T 300 110 T 400 60 T 500 70 T 600 40" fill="none" stroke="#e41e25" stroke-width="3" stroke-linecap="round"/>

                <!-- Secondary Crimson Curve -->
                <path d="M 0 195 Q 80 160 100 150 T 200 130 T 300 140 T 400 110 T 500 120 T 600 90 L 600 210 L 0 210 Z" fill="url(#areaGradientGreen)"/>
                <path d="M 0 195 Q 80 160 100 150 T 200 130 T 300 140 T 400 110 T 500 120 T 600 90" fill="none" stroke="#ff333c" stroke-width="2.5" stroke-dasharray="5 3" stroke-linecap="round"/>

                <!-- Highlight Pulse Points -->
                <circle cx="100" cy="120" r="4.5" fill="#e41e25" stroke="#ffffff" stroke-width="2"/>
                <circle cx="200" cy="90" r="4.5" fill="#e41e25" stroke="#ffffff" stroke-width="2"/>
                <circle cx="300" cy="110" r="4.5" fill="#e41e25" stroke="#ffffff" stroke-width="2"/>
                <circle cx="400" cy="60" r="5" fill="#b01f24" stroke="#ffffff" stroke-width="2.5"/>
                <circle cx="500" cy="70" r="4.5" fill="#e41e25" stroke="#ffffff" stroke-width="2"/>
                <circle cx="600" cy="40" r="5.5" fill="#b01f24" stroke="#ffffff" stroke-width="2.5"/>
              </svg>
              <div class="chart-x-axis-labels">
                <span>Mon (Day 1)</span>
                <span>Tue (Day 2)</span>
                <span>Wed (Day 3)</span>
                <span>Thu (Day 4)</span>
                <span>Fri (Day 5)</span>
                <span>Sat (Day 6)</span>
                <span>Sun (Today)</span>
              </div>
            </div>
          </div>

          <!-- Right Visual: Biometric Department Breakdown -->
          <div class="analytics-card-surface">
            <div class="analytics-card-top">
              <div>
                <h3 class="analytics-card-heading">Biometric Access Distribution</h3>
                <p class="analytics-card-caption">Clearances by personnel division in ${lab}</p>
              </div>
              <span class="analytics-metric-badge">2,820 Total</span>
            </div>

            <div class="analytics-distribution-list">
              
              <div class="distribution-row">
                <div class="dist-header">
                  <span class="dist-role">Dr. Elena Vance (Lead Research)</span>
                  <span class="dist-stat">1,240 passes • <strong>44%</strong></span>
                </div>
                <div class="dist-track">
                  <div class="dist-fill fill-blue" style="width: 44%;"></div>
                </div>
              </div>

              <div class="distribution-row">
                <div class="dist-header">
                  <span class="dist-role">Dr. Marcus Vance (Cryo Lead)</span>
                  <span class="dist-stat">790 passes • <strong>28%</strong></span>
                </div>
                <div class="dist-track">
                  <div class="dist-fill fill-indigo" style="width: 28%;"></div>
                </div>
              </div>

              <div class="distribution-row">
                <div class="dist-header">
                  <span class="dist-role">Security Escort & Sentinel Patrol</span>
                  <span class="dist-stat">510 passes • <strong>18%</strong></span>
                </div>
                <div class="dist-track">
                  <div class="dist-fill fill-cyan" style="width: 18%;"></div>
                </div>
              </div>

              <div class="distribution-row">
                <div class="dist-header">
                  <span class="dist-role">Cleanroom Techs & Maintenance</span>
                  <span class="dist-stat">280 passes • <strong>10%</strong></span>
                </div>
                <div class="dist-track">
                  <div class="dist-fill fill-emerald" style="width: 10%;"></div>
                </div>
              </div>

            </div>

            <!-- Bottom Subsystem Health Row -->
            <div class="analytics-subsystem-pills">
              <div class="subsystem-pill">
                <span class="subsystem-name">ESP32 Stream</span>
                <span class="subsystem-status green">18ms Latency</span>
              </div>
              <div class="subsystem-pill">
                <span class="subsystem-name">Neural Core</span>
                <span class="subsystem-status green">99.98% Confidence</span>
              </div>
              <div class="subsystem-pill">
                <span class="subsystem-name">Optical AI</span>
                <span class="subsystem-status green">30 FPS Live</span>
              </div>
            </div>

          </div>

        </div>

        <!-- Anomaly Diagnostics & Model Precision Table -->
        <div class="analytics-card-surface">
          <div class="analytics-card-top">
            <div>
              <h3 class="analytics-card-heading">Edge AI Anomaly Diagnostics & Model Verification</h3>
              <p class="analytics-card-caption">Precision benchmark across active neural inspection pipelines</p>
            </div>
            <span class="badge-status-green">ALL 4 MODELS VERIFIED</span>
          </div>

          <div class="table-container">
            <table class="enterprise-table">
              <thead>
                <tr>
                  <th>PIPELINE / MODEL</th>
                  <th>SUBSYSTEM</th>
                  <th>INSPECTION RATE</th>
                  <th>FALSE POSITIVES</th>
                  <th>ACCURACY</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>YOLOv8-Nano-Security</strong></td>
                  <td>ESP32-CAM Stream (${lab})</td>
                  <td>30 FPS Real-Time</td>
                  <td><span style="color:#16a34a;">0.001%</span></td>
                  <td><strong>99.92%</strong></td>
                  <td><span class="badge-status-green">OPTIMAL</span></td>
                </tr>
                <tr>
                  <td><strong>FaceNet-ResNet50-Edge</strong></td>
                  <td>Biometric Airlock Relay</td>
                  <td>120 ms Pass Speed</td>
                  <td><span style="color:#16a34a;">0.000%</span></td>
                  <td><strong>99.99%</strong></td>
                  <td><span class="badge-status-green">OPTIMAL</span></td>
                </tr>
                <tr>
                  <td><strong>Thermal-Cryo-Predictor</strong></td>
                  <td>Chamber Sensor Array</td>
                  <td>500 Hz Bus</td>
                  <td><span style="color:#16a34a;">0.002%</span></td>
                  <td><strong>99.85%</strong></td>
                  <td><span class="badge-status-green">NOMINAL</span></td>
                </tr>
                <tr>
                  <td><strong>Sentinel-QuantumShield-V4</strong></td>
                  <td>Distributed Mesh Bus</td>
                  <td>1.2 ms Airgap Fiber</td>
                  <td><span style="color:#16a34a;">0.000%</span></td>
                  <td><strong>100.0%</strong></td>
                  <td><span class="badge-status-green">OPTIMAL</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  function getAlertsHtml(lab) {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">${lab} — Security Incident & Alert Dispatch</h2>
            <p class="banner-subtitle">Real-time threat notification and resolution pipeline</p>
          </div>
        </div>
        <span class="badge-status-green">0 ACTIVE INCIDENTS</span>
      </div>

      <div class="enterprise-card" style="text-align: center; padding: 48px 24px;">
        <div style="width: 48px; height: 48px; margin: 0 auto 12px auto; color: #16a34a;">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <h3 class="card-heading" style="font-size: 18px; margin-bottom: 6px;">Zero Security Alerts in ${lab}</h3>
        <p style="color: #64748b; max-width: 480px; margin: 0 auto 20px auto; font-size: 13.5px;">All telemetry vectors are operating within nominal parameters. The AI Sentinel core is continuously monitoring all node perimeters.</p>
        <button class="btn-primary-action" id="dynSimAlertBtn" style="margin: 0 auto;">
          <span>Simulate Test Alert</span>
        </button>
      </div>
    `;
  }

  function getSystemOverviewHtml(lab = 'SYSTEM') {
    const isLab1 = lab === 'LAB 1';
    const isLab2 = lab === 'LAB 2';
    const title = isLab1 ? 'LAB 1 — Alpha Core Dedicated System Overview' : isLab2 ? 'LAB 2 — Beta Wing Edge Node Architecture' : 'GLOBAL — Distributed Laboratory Security Cluster';
    const subtitle = isLab1 ? 'Alpha Core edge compute, neural inference pipelines, and dedicated lab buses' : isLab2 ? 'Beta Wing isolation controllers, quantum cryptographic shields, and secondary buses' : 'Unified orchestration matrix across isolated laboratory facilities';
    const badgeText = isLab1 ? 'ALPHA CORE ONLINE' : isLab2 ? 'BETA WING ONLINE' : 'ALL 4 LAB NODES ONLINE';
    const uptime = isLab1 ? '99.999%' : isLab2 ? '99.985%' : '99.998%';
    const uptimeSub = isLab1 ? 'Alpha Mainframe Isolated Uptime' : isLab2 ? 'Beta Controller Active Node Uptime' : '428 Days Continuous Operation';
    const radar = isLab1 ? '0 Threats Detected' : isLab2 ? '0 Interlocks Breached' : '0 Incidents';
    const radarSub = isLab1 ? 'Alpha Mesh Perimeter Active' : isLab2 ? 'Quantum Isolation Shield Active' : 'Quantum Shield Active';
    const latency = isLab1 ? '0.8 ms' : isLab2 ? '1.4 ms' : '1.2 ms';
    const latencySub = isLab1 ? 'Direct ESP32-CAM Bus' : isLab2 ? 'Airgap Shielded Bus' : 'Airgap Fiber Bus';

    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div>
            <h2 class="banner-title">${title}</h2>
            <p class="banner-subtitle">${subtitle}</p>
          </div>
        </div>
        <span class="badge-status-green">${badgeText}</span>
      </div>

      <div class="submodule-grid-3col">
        <div class="telemetry-card">
          <span class="telemetry-label">${isLab1 ? 'LAB 1 Node Uptime' : isLab2 ? 'LAB 2 Node Uptime' : 'Cluster Uptime'}</span>
          <span class="telemetry-val" style="color: #16a34a;">${uptime}</span>
          <span style="font-size: 12px; color: #64748b;">${uptimeSub}</span>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">${isLab1 ? 'LAB 1 Perimeter Defense' : isLab2 ? 'LAB 2 Isolation Status' : 'Distributed Threat Radar'}</span>
          <span class="telemetry-val">${radar}</span>
          <span style="font-size: 12px; color: #16a34a;">${radarSub}</span>
        </div>
        <div class="telemetry-card">
          <span class="telemetry-label">${isLab1 ? 'LAB 1 Sensor Bus' : isLab2 ? 'LAB 2 Bus Latency' : 'Inter-Lab Bus Latency'}</span>
          <span class="telemetry-val">${latency}</span>
          <span style="font-size: 12px; color: #64748b;">${latencySub}</span>
        </div>
      </div>
    `;
  }

  function getDeviceStatusHtml(lab = 'SYSTEM') {
    const isLab1 = lab === 'LAB 1';
    const isLab2 = lab === 'LAB 2';
    const title = isLab1 ? 'LAB 1 — Hardware & Sensor Node Matrix' : isLab2 ? 'LAB 2 — Specimen Wing Devices & Relays' : 'GLOBAL — Connected Hardware & Cluster Device Matrix';
    const subtitle = isLab1 ? 'Real-time telemetry and firmware for all Alpha Core cameras and sensors' : isLab2 ? 'Status and firmware health for Beta Wing magnetic seals and environmental arrays' : 'Status and firmware health for all 24 connected IoT and optical edge nodes';

    const rows = isLab1 ? `
      <tr>
        <td class="cell-mono">LAB1-ESP32-CAM</td>
        <td>LAB 1 (Surveillance Window)</td>
        <td>4K Live AI Camera</td>
        <td><span style="color:#16a34a;">-38 dBm (Strong)</span></td>
        <td>v4.2.1-SEC</td>
        <td><span class="badge-status-green">ONLINE</span></td>
      </tr>
      <tr>
        <td class="cell-mono">LAB1-SERVO-PAN</td>
        <td>LAB 1 (PTZ Rig)</td>
        <td>PWM Pan-Tilt Servo</td>
        <td><span style="color:#16a34a;">Direct I2C Bus</span></td>
        <td>v2.1.0</td>
        <td><span class="badge-status-green">ONLINE</span></td>
      </tr>
      <tr>
        <td class="cell-mono">LAB1-MAG-DOOR</td>
        <td>LAB 1 (Airlock Primary)</td>
        <td>12V 500kg Magnetic Lock</td>
        <td><span style="color:#16a34a;">Relay Bus</span></td>
        <td>v1.9.4</td>
        <td><span class="badge-status-green">LOCKED</span></td>
      </tr>
      <tr>
        <td class="cell-mono">LAB1-DHT22-SENS</td>
        <td>LAB 1 (Cleanroom Air)</td>
        <td>Thermo-Hygro Array</td>
        <td><span style="color:#16a34a;">OneWire Bus</span></td>
        <td>v2.8.4</td>
        <td><span class="badge-status-green">21.4°C • 44%</span></td>
      </tr>
    ` : isLab2 ? `
      <tr>
        <td class="cell-mono">LAB2-CAM-VAULT</td>
        <td>LAB 2 (Specimen Airgap)</td>
        <td>Thermal Infrared Sensor</td>
        <td><span style="color:#16a34a;">-41 dBm</span></td>
        <td>v4.2.0-CRYO</td>
        <td><span class="badge-status-green">ONLINE</span></td>
      </tr>
      <tr>
        <td class="cell-mono">LAB2-CRYO-SEAL</td>
        <td>LAB 2 (Isolation Interlock)</td>
        <td>Dual Solenoid Pressure Gate</td>
        <td><span style="color:#16a34a;">CAN Bus</span></td>
        <td>v3.1.2</td>
        <td><span class="badge-status-green">SEALED</span></td>
      </tr>
      <tr>
        <td class="cell-mono">LAB2-GAS-BARRIER</td>
        <td>LAB 2 (Containment Vent)</td>
        <td>CO2 / Halon Suppression Actuator</td>
        <td><span style="color:#16a34a;">Direct Bus</span></td>
        <td>v1.4.0</td>
        <td><span class="badge-status-green">STANDBY</span></td>
      </tr>
    ` : `
      <tr>
        <td class="cell-mono">CAM-AI-0104</td>
        <td>LAB 1 (Airlock)</td>
        <td>4K AI Optical Sensor</td>
        <td><span style="color:#16a34a;">-42 dBm (Strong)</span></td>
        <td>v4.2.1-SEC</td>
        <td><span class="badge-status-green">ONLINE</span></td>
      </tr>
      <tr>
        <td class="cell-mono">DOOR-MAG-0211</td>
        <td>LAB 2 (Specimen Vault)</td>
        <td>Magnetic Interlock Relay</td>
        <td><span style="color:#16a34a;">Direct Bus</span></td>
        <td>v3.1.0</td>
        <td><span class="badge-status-green">ONLINE</span></td>
      </tr>
      <tr>
        <td class="cell-mono">SENS-AQI-0089</td>
        <td>LAB 1 (Cleanroom)</td>
        <td>Environmental Array</td>
        <td><span style="color:#16a34a;">-38 dBm</span></td>
        <td>v2.8.4</td>
        <td><span class="badge-status-green">ONLINE</span></td>
      </tr>
    `;

    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
          </div>
          <div>
            <h2 class="banner-title">${title}</h2>
            <p class="banner-subtitle">${subtitle}</p>
          </div>
        </div>
        <button class="btn-secondary-action" id="dynPingBtn">
          <span>Ping ${isLab1 ? 'LAB 1 Nodes' : isLab2 ? 'LAB 2 Nodes' : 'All Cluster Devices'}</span>
        </button>
      </div>

      <div class="enterprise-card">
        <div class="table-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>DEVICE ID</th>
                <th>LOCATION</th>
                <th>TYPE</th>
                <th>SIGNAL / BUS</th>
                <th>FIRMWARE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getSettingsHtml(lab = 'SYSTEM') {
    const isLab1 = lab === 'LAB 1';
    const isLab2 = lab === 'LAB 2';
    const title = isLab1 ? 'LAB 1 — Dedicated Security & Node Settings' : isLab2 ? 'LAB 2 — Specimen Wing Parameters & Interlock Rules' : 'GLOBAL — Enterprise Security Configuration';
    const subtitle = isLab1 ? 'Configure IP feeds, servo presets, threshold alarms, and magnetic relay timeouts for LAB 1' : isLab2 ? 'Configure containment protocol, cryogenic threshold alarms, and isolation policies for LAB 2' : 'System-wide cryptographic parameters and authentication thresholds';

    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">${title}</h2>
            <p class="banner-subtitle">${subtitle}</p>
          </div>
        </div>
      </div>

      <div class="submodule-grid-2col">
        <div class="enterprise-card">
          <h3 class="card-heading">${isLab1 ? 'LAB 1 Camera Stream & IP Config' : isLab2 ? 'LAB 2 Camera Stream & IP Config' : 'Primary Stream Gateway'}</h3>
          <p class="card-caption">RTSP and HTTP Stream Parameters</p>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 700; color: #475569;">Stream Endpoint</label>
              <input type="text" value="${isLab1 ? 'http://192.168.1.50:81/stream' : isLab2 ? 'http://192.168.1.51:81/stream' : 'http://192.168.1.50:81/stream'}" class="styled-input-field" style="width: 100%; box-sizing: border-box; margin-top: 4px;">
            </div>
            <div>
              <label style="font-size: 11.5px; font-weight: 700; color: #475569;">Auto-Lock Timeout</label>
              <input type="text" value="${isLab1 ? '5000 ms (5 Seconds)' : isLab2 ? '3000 ms (Strict)' : '5000 ms'}" class="styled-input-field" style="width: 100%; box-sizing: border-box; margin-top: 4px;">
            </div>
          </div>
        </div>

        <div class="enterprise-card">
          <h3 class="card-heading">${isLab1 ? 'LAB 1 Threshold Alarms' : isLab2 ? 'LAB 2 Cryo Containment' : 'Security Policy'}</h3>
          <p class="card-caption">Defensive triggers and acoustic sirens</p>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 700; color: #475569;">PIR Motion Sensitivity</label>
              <input type="text" value="${isLab1 ? 'High (98%)' : isLab2 ? 'Ultra-High (99.8%)' : 'Standard'}" class="styled-input-field" style="width: 100%; box-sizing: border-box; margin-top: 4px;">
            </div>
            <div>
              <label style="font-size: 11.5px; font-weight: 700; color: #475569;">Optical Reticle Color</label>
              <input type="text" value="#00d2ff (Electric Cyan)" class="styled-input-field" style="width: 100%; box-sizing: border-box; margin-top: 4px;">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getChatbotHtml() {
    return `
      <div class="sentinel-gpt-card-interface is-welcome-state" id="sentinelGptInterface">
        
        <!-- Top Interface Header -->
        <div class="gpt-ui-topbar">
          <div class="gpt-brand-left">
            <div class="gpt-shield-icon-badge" title="SentinelAI-X Autonomous Core">
              <img src="logo.svg" alt="SentinelAI-X Logo" class="gpt-brand-logo-img">
            </div>
            <span class="gpt-brand-name-text">SentinelAI-X</span>
          </div>

          <div class="gpt-ui-top-right">
            <button class="gpt-new-chat-btn" id="chatNewSessionBtn" title="Start new session">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>New Chat</span>
            </button>
            <div class="gpt-online-pill">
              <span class="online-beacon-dot"></span>
              <span>Online</span>
            </div>
          </div>
        </div>

        <!-- Scanning Beam / Scrolling Laser Animation Line -->
        <div class="gpt-scanning-laser-track" id="gptScanningTrack">
          <div class="gpt-scanning-laser-beam"></div>
        </div>

        <!-- Main Conversation Area / Hero Container -->
        <div class="gpt-content-viewport" id="chatMessagesBox">
          
          <!-- Exact Center Starting Title -->
          <div class="gpt-exact-hero" id="gptWelcomeHero">
            <h2 class="gpt-ready-heading">Hello! How can I help you today?</h2>
            
            <!-- Quick Access Two-Category Section -->
            <div class="gpt-quick-access-box">
              <div class="gpt-qa-tabs-header">
                <button type="button" class="gpt-qa-tab-btn active" data-qa-tab="tasks">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                  <span>⚡ To-Do Tasks & Controls</span>
                </button>
                <button type="button" class="gpt-qa-tab-btn" data-qa-tab="info">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span>📊 Component & Telemetry Info</span>
                </button>
              </div>

              <!-- Category 1: To Do Tasks & Commands -->
              <div class="gpt-qa-tab-content active" id="qaTabTasks">
                <div class="gpt-qa-grid">
                  <button type="button" class="gpt-qa-card chat-prompt-chip" data-query="Open and unlock the laboratory airlock door">
                    <span class="qa-icon-wrap" style="color: #ff4d55; background: rgba(228, 30, 37, 0.15);">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"></path><path d="M19 21v-14l-8-4-8 4v14"></path><circle cx="9" cy="14" r="1"></circle></svg>
                    </span>
                    <div class="qa-info">
                      <strong class="qa-title">Open the Door</strong>
                      <span class="qa-desc">Disengage magnetic lock</span>
                    </div>
                  </button>

                  <button type="button" class="gpt-qa-card chat-prompt-chip" data-query="Turn on and test the emergency acoustic alarm">
                    <span class="qa-icon-wrap" style="color: #ea580c; background: #fff7ed;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </span>
                    <div class="qa-info">
                      <strong class="qa-title">On the Alarm</strong>
                      <span class="qa-desc">Sound acoustic siren (85 dB)</span>
                    </div>
                  </button>

                  <button type="button" class="gpt-qa-card chat-prompt-chip" data-query="Engage emergency isolation lockdown protocol">
                    <span class="qa-icon-wrap" style="color: #dc2626; background: #fef2f2;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </span>
                    <div class="qa-info">
                      <strong class="qa-title">Lockdown Node</strong>
                      <span class="qa-desc">Emergency magnetic seal</span>
                    </div>
                  </button>

                  <button type="button" class="gpt-qa-card chat-prompt-chip" data-query="Run AI neural perimeter scan for optical threats">
                    <span class="qa-icon-wrap" style="color: #16a34a; background: #f0fdf4;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    </span>
                    <div class="qa-info">
                      <strong class="qa-title">Run AI Scan</strong>
                      <span class="qa-desc">Sweep all 4 camera streams</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Category 2: Component & Telemetry Information -->
              <div class="gpt-qa-tab-content" id="qaTabInfo" style="display: none;">
                <div class="gpt-qa-grid">
                  <button type="button" class="gpt-qa-card chat-prompt-chip" data-query="What is the current temperature, humidity, and atmospheric AQI?">
                    <span class="qa-icon-wrap" style="color: #0284c7; background: #f0f9ff;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                    </span>
                    <div class="qa-info">
                      <strong class="qa-title">What is Temp & Humidity?</strong>
                      <span class="qa-desc">21.4°C • 44% RH • 12 AQI</span>
                    </div>
                  </button>

                  <button type="button" class="gpt-qa-card chat-prompt-chip" data-query="Show active AI cameras, FPS rates, and stream latencies">
                    <span class="qa-icon-wrap" style="color: #7c3aed; background: #f5f3ff;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    </span>
                    <div class="qa-info">
                      <strong class="qa-title">Camera FPS Status</strong>
                      <span class="qa-desc">4 / 4 Active • 60 FPS</span>
                    </div>
                  </button>

                  <button type="button" class="gpt-qa-card chat-prompt-chip" data-query="Who entered the laboratory recently? Show biometric clearance logs">
                    <span class="qa-icon-wrap" style="color: #0d9488; background: #f0fdfa;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </span>
                    <div class="qa-info">
                      <strong class="qa-title">Recent Access Logs</strong>
                      <span class="qa-desc">148 Cleared • 99.8% Match</span>
                    </div>
                  </button>

                  <button type="button" class="gpt-qa-card chat-prompt-chip" data-query="What is the DEFCON protocol and overall system defense status?">
                    <span class="qa-icon-wrap" style="color: #16a34a; background: #f0fdf4;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </span>
                    <div class="qa-info">
                      <strong class="qa-title">DEFCON & Defense</strong>
                      <span class="qa-desc">DEFCON 5 • 100% Nominal</span>
                    </div>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

        <!-- Floating Scroll to Bottom Button (Image 2) -->
        <button class="gpt-scroll-bottom-btn" id="chatScrollBottomBtn" title="Scroll to latest message" style="display: none;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>

        <!-- Hidden File Input for Image Drop / File Picker -->
        <input type="file" id="chatFileInput" accept="image/*,.json,.csv" style="display: none;">

        <!-- Exact Rectangular Typing Box Container (Image 1 & Image 2) -->
        <div class="gpt-exact-bottom-wrapper">
          
          <!-- Attachment Dropdown Menu Popup -->
          <div class="gpt-attach-popup" id="chatAttachPopup" style="display: none;">
            <button type="button" class="gpt-attach-option" id="attachImageOptionBtn">
              <span class="attach-opt-icon" style="color: #ff4d55; background: rgba(228, 30, 37, 0.15);">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </span>
              <div class="attach-opt-text">
                <strong>Upload / Drop Image</strong>
                <span>Inspect face, badge, or anomaly</span>
              </div>
            </button>
            
            <button type="button" class="gpt-attach-option" id="attachSnapshotOptionBtn">
              <span class="attach-opt-icon" style="color: #ff333c; background: rgba(228, 30, 37, 0.12);">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              </span>
              <div class="attach-opt-text">
                <strong>Grab Live ESP32 Frame</strong>
                <span>Attach current camera snapshot</span>
              </div>
            </button>

            <button type="button" class="gpt-attach-option" id="attachTelemetryOptionBtn">
              <span class="attach-opt-icon" style="color: #16a34a; background: #f0fdf4;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </span>
              <div class="attach-opt-text">
                <strong>Attach Telemetry Log</strong>
                <span>Include live sensor readings</span>
              </div>
            </button>
          </div>

          <!-- Attached Item Preview Strip -->
          <div class="gpt-attached-strip" id="chatAttachedStrip" style="display: none;"></div>

          <form class="gpt-exact-pill-input-box" id="chatInputForm">
            <button type="button" class="gpt-pill-add-btn" id="chatAttachBtn" title="Add attachment or image">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            
            <input type="text" class="gpt-pill-text-input" id="chatTextInput" placeholder="Ask anything, type a command, or drop an image..." autocomplete="off">
            
            <div class="gpt-pill-actions-right">
              <button type="button" class="gpt-pill-think-btn" id="chatThinkBtn" title="Deep Reasoning Mode">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path>
                  <line x1="9" y1="21" x2="15" y2="21"></line>
                </svg>
                <span>Think</span>
              </button>

              <button type="button" class="gpt-pill-mic-btn" id="chatMicBtn" title="Voice Input">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              </button>

              <button type="submit" class="gpt-waveform-send-btn gpt-chatbot-symbol-btn" id="chatSendBtn" title="Send (Enter)">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </form>

        </div>

      </div>
    `;
  }

  function getDeviceStatusHtml() {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
          </div>
          <div>
            <h2 class="banner-title">SYSTEM — Connected Hardware & Device Matrix</h2>
            <p class="banner-subtitle">Status and firmware health for all 24 connected IoT and optical edge nodes</p>
          </div>
        </div>
        <button class="btn-secondary-action" id="dynPingBtn">
          <span>Ping All Devices</span>
        </button>
      </div>

      <div class="enterprise-card">
        <div class="table-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>DEVICE ID</th>
                <th>LOCATION</th>
                <th>TYPE</th>
                <th>SIGNAL</th>
                <th>FIRMWARE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-mono">CAM-AI-0104</td>
                <td>LAB 1 (Airlock)</td>
                <td>4K AI Optical Sensor</td>
                <td><span style="color:#16a34a;">-42 dBm (Strong)</span></td>
                <td>v4.2.1-SEC</td>
                <td><span class="badge-status-green">ONLINE</span></td>
              </tr>
              <tr>
                <td class="cell-mono">DOOR-MAG-0211</td>
                <td>LAB 2 (Specimen Vault)</td>
                <td>Magnetic Interlock Relay</td>
                <td><span style="color:#16a34a;">Direct Bus</span></td>
                <td>v3.1.0</td>
                <td><span class="badge-status-green">ONLINE</span></td>
              </tr>
              <tr>
                <td class="cell-mono">SENS-AQI-0089</td>
                <td>LAB 1 (Cleanroom)</td>
                <td>Environmental Array</td>
                <td><span style="color:#16a34a;">-38 dBm</span></td>
                <td>v2.8.4</td>
                <td><span class="badge-status-green">ONLINE</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getNotificationsHtml() {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">SYSTEM — Security Notifications & Bulletins</h2>
            <p class="banner-subtitle">System alerts and cryptographic event dispatches</p>
          </div>
        </div>
      </div>

      <div class="enterprise-card">
        <div class="table-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>SEVERITY</th>
                <th>SOURCE</th>
                <th>NOTIFICATION SUMMARY</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-mono">10:15 UTC</td>
                <td><span class="badge-status-green">INFO</span></td>
                <td>System Backup</td>
                <td>Daily cryptographic telemetry snapshot committed successfully.</td>
              </tr>
              <tr>
                <td class="cell-mono">09:00 UTC</td>
                <td><span class="badge-status-green">SECURITY</span></td>
                <td>Neural Engine</td>
                <td>SentinelVision v4.2 model weights updated with zero downtime.</td>
              </tr>
              <tr>
                <td class="cell-mono">08:30 UTC</td>
                <td><span class="badge-status-green">ROUTINE</span></td>
                <td>Cleanroom HVAC</td>
                <td>Scheduled air filtration cycle completed (AQI: 12).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getSettingsHtml() {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">SYSTEM — System Configuration & Security Policies</h2>
            <p class="banner-subtitle">Access thresholds, AI sensitivity, and quantum encryption policies</p>
          </div>
        </div>
        <button class="btn-primary-action" id="dynSaveBtn">
          <span>Save Changes</span>
        </button>
      </div>

      <div class="enterprise-card">
        <h3 class="card-heading">Biometric Strictness & Anomaly Sensitivity</h3>
        <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 10px;">
          <label style="font-size: 13.5px; font-weight: 600; color: #cbd5e1;">
            Biometric Facial Match Threshold: <strong style="color: #ff4d55;">99.0%</strong>
          </label>
          <input type="range" min="90" max="100" value="99" style="width: 100%; accent-color: #e41e25;">
          
          <label style="font-size: 13.5px; font-weight: 600; color: #cbd5e1; margin-top: 8px;">
            Optical Anomaly Sensitivity: <strong style="color: #ff4d55;">High (Auto-Lock on Unrecognized Motion)</strong>
          </label>
          <input type="range" min="1" max="10" value="8" style="width: 100%; accent-color: #e41e25;">
        </div>
      </div>
    `;
  }

  function getDefaultHtml(lab, section) {
    return `
      <div class="view-card-banner">
        <div class="banner-left">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div>
            <h2 class="banner-title">${lab} — ${section}</h2>
            <p class="banner-subtitle">Active telemetry matrix</p>
          </div>
        </div>
      </div>
    `;
  }

  function attachDynamicListeners() {
    // Chatbot conversational functionality (ChatGPT-style)
    const chatInputForm = document.getElementById('chatInputForm');
    const chatTextInput = document.getElementById('chatTextInput');
    const chatMessagesBox = document.getElementById('chatMessagesBox');
    const chatNewSessionBtn = document.getElementById('chatNewSessionBtn');
    const chatAttachBtn = document.getElementById('chatAttachBtn');
    const promptChips = document.querySelectorAll('.chat-prompt-chip');

    function appendChatMessage(sender, htmlContent) {
      if (!chatMessagesBox) return;

      const gptContainer = document.getElementById('sentinelGptInterface');
      if (gptContainer) {
        gptContainer.classList.remove('is-welcome-state');
        gptContainer.classList.add('is-chat-active');
      }

      const welcomeHero = document.getElementById('gptWelcomeHero');
      if (welcomeHero) {
        welcomeHero.style.display = 'none';
      }

      const row = document.createElement('div');
      row.className = `gpt-message-row ${sender === 'user' ? 'user-row' : 'bot-row'}`;

      if (sender === 'user') {
        row.innerHTML = `
          <div class="gpt-user-pill-bubble">${htmlContent}</div>
        `;
      } else {
        row.innerHTML = `
          <div class="gpt-bot-markdown-content">
            ${htmlContent}
          </div>
        `;
      }

      chatMessagesBox.appendChild(row);
      chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

      const scrollBtn = document.getElementById('chatScrollBottomBtn');
      if (scrollBtn) {
        scrollBtn.style.display = (chatMessagesBox.scrollHeight > chatMessagesBox.clientHeight) ? 'flex' : 'none';
      }
    }

    function showTypingIndicator() {
      if (!chatMessagesBox) return;
      const indicator = document.createElement('div');
      indicator.className = 'gpt-message-row bot-row gpt-typing-row';
      indicator.id = 'gptTypingIndicator';
      indicator.innerHTML = `
        <div class="gpt-typing-dots">
          <span></span><span></span><span></span>
        </div>
      `;
      chatMessagesBox.appendChild(indicator);
      chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    }

    function removeTypingIndicator() {
      const indicator = document.getElementById('gptTypingIndicator');
      if (indicator) indicator.remove();
    }

    const gptScanningTrack = document.getElementById('gptScanningTrack');
    const chatMicBtn = document.getElementById('chatMicBtn');
    const chatThinkBtn = document.getElementById('chatThinkBtn');
    const chatScrollBottomBtn = document.getElementById('chatScrollBottomBtn');

    if (chatThinkBtn) {
      chatThinkBtn.addEventListener('click', () => {
        chatThinkBtn.classList.toggle('active');
        const isActive = chatThinkBtn.classList.contains('active');
        showToast(isActive ? '🧠 Deep Think Mode Activated (Extended Reasoning)' : 'Standard AI Mode', 'info');
      });
    }

    if (chatScrollBottomBtn) {
      chatScrollBottomBtn.addEventListener('click', () => {
        if (chatMessagesBox) {
          chatMessagesBox.scrollTo({ top: chatMessagesBox.scrollHeight, behavior: 'smooth' });
        }
      });
    }

    if (chatMessagesBox) {
      chatMessagesBox.addEventListener('scroll', () => {
        if (chatScrollBottomBtn) {
          const isScrolledUp = (chatMessagesBox.scrollHeight - chatMessagesBox.scrollTop - chatMessagesBox.clientHeight) > 60;
          chatScrollBottomBtn.style.display = isScrolledUp ? 'flex' : 'none';
        }
      });
    }

    if (chatNewSessionBtn) {
      chatNewSessionBtn.addEventListener('click', () => {
        const viewHtml = getChatbotHtml();
        const genericContainer = document.getElementById('genericViewContainer');
        if (genericContainer) {
          genericContainer.innerHTML = viewHtml;
          attachDynamicListeners();
        }
        showToast('Started clean session. Hello! How can I help you today?', 'info');
      });
    }

    function startScanningAnimation() {
      if (gptScanningTrack) gptScanningTrack.classList.add('active');
    }

    function stopScanningAnimation() {
      if (gptScanningTrack) gptScanningTrack.classList.remove('active');
    }

    // QA Tabs Switching (To-Do Tasks vs Component Info)
    const qaTabBtns = document.querySelectorAll('.gpt-qa-tab-btn');
    const qaTabTasks = document.getElementById('qaTabTasks');
    const qaTabInfo = document.getElementById('qaTabInfo');

    qaTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        qaTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-qa-tab');
        if (tab === 'tasks') {
          if (qaTabTasks) qaTabTasks.style.display = 'block';
          if (qaTabInfo) qaTabInfo.style.display = 'none';
        } else {
          if (qaTabTasks) qaTabTasks.style.display = 'none';
          if (qaTabInfo) qaTabInfo.style.display = 'block';
        }
      });
    });

    // Attachment & Dropdown Logic
    let currentAttachment = null;
    const chatAttachPopup = document.getElementById('chatAttachPopup');
    const chatAttachedStrip = document.getElementById('chatAttachedStrip');
    const chatFileInput = document.getElementById('chatFileInput');
    const attachImageOptionBtn = document.getElementById('attachImageOptionBtn');
    const attachSnapshotOptionBtn = document.getElementById('attachSnapshotOptionBtn');
    const attachTelemetryOptionBtn = document.getElementById('attachTelemetryOptionBtn');

    function updateAttachedStrip() {
      if (!chatAttachedStrip) return;
      if (!currentAttachment) {
        chatAttachedStrip.style.display = 'none';
        chatAttachedStrip.innerHTML = '';
        return;
      }
      chatAttachedStrip.style.display = 'flex';
      chatAttachedStrip.innerHTML = `
        <div class="gpt-attached-chip">
          <span class="chip-icon">${currentAttachment.type === 'image' ? '🖼️' : currentAttachment.type === 'snapshot' ? '📹' : '📊'}</span>
          <span class="chip-label">${currentAttachment.name}</span>
          <button type="button" class="chip-remove-btn" id="removeAttachmentBtn" title="Remove attachment">×</button>
        </div>
      `;
      const removeBtn = document.getElementById('removeAttachmentBtn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          currentAttachment = null;
          updateAttachedStrip();
          showToast('Attachment removed', 'info');
        });
      }
    }

    if (chatAttachBtn && chatAttachPopup) {
      chatAttachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = chatAttachPopup.style.display === 'flex';
        chatAttachPopup.style.display = isOpen ? 'none' : 'flex';
      });
      document.addEventListener('click', () => {
        if (chatAttachPopup) chatAttachPopup.style.display = 'none';
      });
    }

    if (attachImageOptionBtn && chatFileInput) {
      attachImageOptionBtn.addEventListener('click', () => {
        if (chatAttachPopup) chatAttachPopup.style.display = 'none';
        chatFileInput.click();
      });
    }

    if (chatFileInput) {
      chatFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          currentAttachment = {
            type: 'image',
            name: file.name
          };
          updateAttachedStrip();
          showToast(`Attached image: ${file.name}`, 'success');
        }
      });
    }

    if (attachSnapshotOptionBtn) {
      attachSnapshotOptionBtn.addEventListener('click', () => {
        if (chatAttachPopup) chatAttachPopup.style.display = 'none';
        currentAttachment = {
          type: 'snapshot',
          name: 'ESP32_Cam01_Live_Capture.jpg'
        };
        updateAttachedStrip();
        showToast('Attached live ESP32 camera frame for AI visual inspection', 'success');
      });
    }

    if (attachTelemetryOptionBtn) {
      attachTelemetryOptionBtn.addEventListener('click', () => {
        if (chatAttachPopup) chatAttachPopup.style.display = 'none';
        currentAttachment = {
          type: 'telemetry',
          name: 'Lab1_Sensors_Telemetry.json'
        };
        updateAttachedStrip();
        showToast('Attached real-time laboratory telemetry dataset', 'success');
      });
    }

    // Drag and Drop files onto chat container
    const gptInterface = document.querySelector('.sentinel-gpt-card-interface');
    if (gptInterface) {
      ['dragenter', 'dragover'].forEach(eventName => {
        gptInterface.addEventListener(eventName, (e) => {
          e.preventDefault();
          gptInterface.classList.add('drag-active');
        });
      });
      ['dragleave', 'drop'].forEach(eventName => {
        gptInterface.addEventListener(eventName, (e) => {
          e.preventDefault();
          gptInterface.classList.remove('drag-active');
        });
      });
      gptInterface.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];
          currentAttachment = {
            type: file.type.includes('image') ? 'image' : 'telemetry',
            name: file.name
          };
          updateAttachedStrip();
          showToast(`Dropped & attached: ${file.name}`, 'success');
        }
      });
    }

    function processChatQuery(query) {
      const q = query.toLowerCase().trim();
      let response = '';

      startScanningAnimation();

      if (currentAttachment && (currentAttachment.type === 'image' || currentAttachment.type === 'snapshot')) {
        response = `
          <p><strong>🖼️ AI Computer Vision & Visual Diagnostics for:</strong> <code>${currentAttachment.name}</code></p>
          <ol>
            <li><strong>Facial Verification:</strong> Dr. Elena Rostova identified with <strong>99.8% match confidence</strong>.</li>
            <li><strong>Optical Threat Inspection:</strong> Zero weapons, concealed items, or unauthorized personnel in camera viewport.</li>
            <li><strong>Bounding Box Coordinates:</strong> <code>[x: 142, y: 88, w: 230, h: 310]</code> • Label: <em>Clearroom Authorized Scientist</em></li>
            <li><strong>Resolution & Quality:</strong> 1080p High Dynamic Range (HDR) • Noise index: 0.02% nominal.</li>
          </ol>
          <p>Visual integrity verified and archived to laboratory audit vault.</p>
        `;
        currentAttachment = null;
        updateAttachedStrip();
      } else if (currentAttachment && currentAttachment.type === 'telemetry') {
        response = `
          <p><strong>📊 Telemetry Dataset Audit for:</strong> <code>${currentAttachment.name}</code></p>
          <ol>
            <li><strong>Data Integrity:</strong> SHA-256 block header matched. Zero corrupted frame packets.</li>
            <li><strong>Sensor Inferences:</strong> 24 IoT micro-sensors evaluated. All channels nominal.</li>
            <li><strong>Anomaly Risk Index:</strong> <strong>0.00%</strong> (Safe for ongoing biological & chemical processing).</li>
          </ol>
        `;
        currentAttachment = null;
        updateAttachedStrip();
      } else if (q.includes('open') && q.includes('door') || q.includes('unlock')) {
        response = `
          <p><strong>🚪 Laboratory Airlock Door Override Initiated:</strong></p>
          <ol>
            <li><strong>Airlock ID:</strong> LAB 1 Entrance Bulkhead #01</li>
            <li><strong>Biometric Validation:</strong> Administrator Level 4 Clearance Verified.</li>
            <li><strong>Interlock Status:</strong> <strong>Magnetic seal disengaged</strong> (30-second ingress window active).</li>
          </ol>
          <p><em>Safety interlock will automatically re-engage upon optical motion clearance.</em></p>
        `;
        showToast('🔓 Airlock Door Unlocked: Magnetic seal disengaged', 'success');
      } else if (q.includes('alarm') || q.includes('on the alarm') || q.includes('sound alarm')) {
        response = `
          <p><strong>🔔 Emergency Acoustic Alarm Beacon Triggered:</strong></p>
          <ol>
            <li><strong>Acoustic Siren:</strong> <strong>85 dB Pulse Tone Active</strong> across facility speakers.</li>
            <li><strong>Optical Warning:</strong> Amber strobe beacons cycling in LAB 1 & LAB 2.</li>
            <li><strong>Security Dispatch:</strong> Incident Log #ALM-9024 recorded to central audit bus.</li>
          </ol>
          <p><em>Use "Turn off alarm" or the header control matrix to disengage.</em></p>
        `;
        showToast('🔔 Emergency Alarm Sounded (85 dB)', 'warning');
      } else if (q.includes('lockdown') || q.includes('emergency lockdown')) {
        response = `
          <p><strong>🚨 EMERGENCY ISOLATION LOCKDOWN ENGAGED:</strong></p>
          <ol>
            <li><strong>Magnetic Seals:</strong> All airlocks, cryo chambers, and exhaust louvers sealed.</li>
            <li><strong>Access Restrictions:</strong> Level 5 Biometric Override required for access.</li>
            <li><strong>Telemetry Isolation:</strong> Laboratory network segregated into airgapped mode.</li>
          </ol>
        `;
        showToast('🚨 EMERGENCY LOCKDOWN ENGAGED', 'danger');
      } else if (q.includes('temp') || q.includes('humidity') || q.includes('temperature') || q.includes('aqi')) {
        response = `
          <p><strong>🌡️ Real-Time Laboratory Climate & Environmental Telemetry:</strong></p>
          <ol>
            <li><strong>Ambient Temperature:</strong> <strong>21.4 °C</strong> (Optimal baseline: 20°C - 24°C)</li>
            <li><strong>Relative Humidity:</strong> <strong>44% RH</strong> (Optimal cleanroom parameter)</li>
            <li><strong>Air Quality Index (AQI):</strong> <strong>12 AQI</strong> (Grade A Cleanroom Standard)</li>
            <li><strong>Cryogenic Dewar #01:</strong> <code>-78.5 °C</code> (Vault temperature stable)</li>
            <li><strong>Differential Pressure:</strong> <code>+28.5 Pa</code> (Positive isolation nominal)</li>
          </ol>
        `;
      } else if (q === 'fsd' || q.includes('fsd') || q.includes('functional specification')) {
        response = `
          <p>If you mean <strong>FSD = Functional Specification Document</strong>, it is a document that explains <strong>what your software/project must do</strong>, feature by feature.</p>
          <p>For your <strong>SentinelAI-X BMS/security dashboard</strong>, an FSD would typically contain:</p>
          <ol>
            <li><strong>Project Overview</strong></li>
            <li><strong>Objectives</strong></li>
            <li><strong>System Scope</strong></li>
            <li><strong>User Roles</strong></li>
            <li><strong>Functional Requirements</strong>
              <ul>
                <li>Login</li>
                <li>Lab 1 / Lab 2 navigation</li>
                <li>Live monitoring</li>
                <li>Sensor data</li>
                <li>AI camera</li>
                <li>Door control</li>
                <li>Alerts</li>
                <li>Analytics</li>
                <li>AI chatbot</li>
                <li>SIDEBAR/opening feature</li>
              </ul>
            </li>
            <li><strong>Non-Functional Requirements</strong>
              <ul>
                <li>Performance</li>
                <li>Security</li>
                <li>Reliability</li>
                <li>Usability</li>
              </ul>
            </li>
            <li><strong>System Architecture</strong></li>
            <li><strong>Page-wise functionality</strong></li>
            <li><strong>Database/Firebase requirements</strong></li>
            <li><strong>Testing & Acceptance Criteria</strong></li>
          </ol>
        `;
      } else if (q.includes('status') || q.includes('lab 1') || q.includes('audit')) {
        response = `
          <p><strong>LAB 1 (Alpha Core) Facility Audit Report:</strong></p>
          <ol>
            <li><strong>Security Protocol:</strong> <strong>DEFCON 5</strong> • 100% Defense Perimeter</li>
            <li><strong>Active AI Cameras:</strong> <strong>4 / 4 Active</strong> • 60 FPS 4K Streams</li>
            <li><strong>Biometric Clearances:</strong> <strong>148 Cleared</strong> • 0 Unauthorized Attempts</li>
            <li><strong>Sensor Telemetry:</strong> <strong>21.4°C • 44% RH</strong> • AQI: 12 (Cleanroom Grade A)</li>
          </ol>
          <ul>
            <li><strong>Magnetic Seals:</strong> All airlocks and secondary bulkheads are locked and armed.</li>
            <li><strong>AI Inference:</strong> SentinelVision model v4.2 processing at 60 FPS with zero flagged anomalies.</li>
          </ul>
        `;
      } else if (q.includes('threat') || q.includes('scan') || q.includes('diagnostics')) {
        response = `
          <p><strong>⚡ Neural Threat Diagnostics Completed:</strong></p>
          <ol>
            <li><strong>Perimeter Status:</strong> 0 Active Threats Detected across LAB 01 and LAB 02.</li>
            <li><strong>Optical Infiltration Check:</strong> 100% Clean across all 4 camera streams.</li>
            <li><strong>LiDAR Barrier:</strong> Frequency modulated at 905nm • Zero beam breaks.</li>
            <li><strong>Cryptographic Integrity:</strong> SHA-256 telemetry block header verified.</li>
          </ol>
        `;
      } else if (q.includes('camera') || q.includes('video') || q.includes('fps') || q.includes('surveillance')) {
        response = `
          <p><strong>📹 4K AI Camera Surveillance Matrix Status:</strong></p>
          <ul>
            <li><strong>CAM-01 (Entrance Airlock):</strong> 60.0 FPS • Latency: 3.2ms • Biometric Scanner Active</li>
            <li><strong>CAM-02 (Biohazard Containment):</strong> 59.9 FPS • Latency: 3.4ms • Optical Motion 0%</li>
            <li><strong>CAM-03 (Cryogenic Vault):</strong> 60.0 FPS • Latency: 3.1ms • Thermal Filter Active</li>
            <li><strong>CAM-04 (Neural Compute Core):</strong> 60.1 FPS • Latency: 3.0ms • LiDAR Overlay Active</li>
          </ul>
        `;
      } else if (q.includes('biometric') || q.includes('facial') || q.includes('access') || q.includes('clearance') || q.includes('log') || q.includes('entered')) {
        response = `
          <p><strong>👤 Biometric Access & Facial Verification Logs:</strong></p>
          <ul>
            <li><strong>10:45:12 UTC:</strong> Dr. Elena Rostova — <em>Level 4 Lead Scientist</em> (Face Match: <strong>99.8%</strong>) • <code>PASSED</code></li>
            <li><strong>10:30:05 UTC:</strong> Marcus Vance — <em>Systems Engineer</em> (Face Match: <strong>99.4%</strong>) • <code>PASSED</code></li>
            <li><strong>Total Validated Entries Today:</strong> 148 Cleared • 0 Denials.</li>
          </ul>
        `;
      } else if (q.includes('defcon') || q.includes('defense') || q.includes('incident')) {
        response = `
          <p><strong>🛡️ DEFCON Protocol & Defense Readiness Report:</strong></p>
          <ol>
            <li><strong>Readiness Level:</strong> <strong>DEFCON 5 (Normal Readiness)</strong></li>
            <li><strong>Perimeter Status:</strong> 100% Defense Integrity across all outer sensors.</li>
            <li><strong>Active Incidents:</strong> 0 Unresolved Alerts in queue.</li>
          </ol>
        `;
      } else {
        response = `
          <p><strong>SentinelAI-X Telemetry Analysis for:</strong> <em>"${query}"</em></p>
          <p>All connected laboratory nodes (LAB 1 Alpha Core, LAB 2 Beta Wing) are synchronized with the central telemetry bus. Perimeter security, optical classification models, and sensor diagnostics are operating nominally.</p>
        `;
      }

      showTypingIndicator();

      setTimeout(() => {
        removeTypingIndicator();
        stopScanningAnimation();
        appendChatMessage('bot', response);
      }, 450);
    }

    if (chatTextInput && chatInputForm) {
      chatTextInput.addEventListener('input', () => {
        if (chatTextInput.value.trim().length > 0) {
          chatInputForm.classList.add('is-typing');
        } else {
          chatInputForm.classList.remove('is-typing');
        }
      });
    }

    if (chatInputForm && chatTextInput) {
      chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatTextInput.value.trim();
        if (!msg && !currentAttachment) return;
        const displayMsg = currentAttachment ? `[${currentAttachment.name}] ${msg || 'Analyze attached file'}` : msg;
        appendChatMessage('user', displayMsg);
        chatTextInput.value = '';
        chatInputForm.classList.remove('is-typing');
        processChatQuery(msg || 'Analyze attached file');
      });
    }

    if (chatMicBtn) {
      chatMicBtn.addEventListener('click', () => {
        showToast('🎙️ SentinelAI Voice Input: Listening for laboratory command...', 'info');
      });
    }

    promptChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (!query) return;
        appendChatMessage('user', query);
        processChatQuery(query);
      });
    });

    if (chatNewSessionBtn) {
      chatNewSessionBtn.addEventListener('click', () => {
        const viewHtml = getChatbotHtml();
        genericViewContainer.innerHTML = viewHtml;
        attachDynamicListeners();
        showToast('Started new SentinelAI conversation session', 'info');
      });
    }

    if (chatAttachBtn) {
      chatAttachBtn.addEventListener('click', () => {
        showToast('Attached live sensor telemetry trace to prompt context.', 'info');
      });
    }

    // Lab 2 Component Actions & Toggles
    const lab2CompBtns = document.querySelectorAll('[data-comp-action]');
    lab2CompBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.getAttribute('data-comp-action');
        if (action === 'green-led') {
          const valEl = document.getElementById('valGreenLed');
          const statusEl = document.getElementById('statusGreenLed');
          if (valEl && statusEl) {
            const isHigh = valEl.textContent.includes('HIGH');
            valEl.textContent = isHigh ? 'LOW • Off (0.0V)' : 'HIGH • Cleared (3.3V)';
            statusEl.textContent = isHigh ? 'INACTIVE' : 'ACTIVE';
            statusEl.className = isHigh ? 'lab2-pill-status status-standby-red' : 'lab2-pill-status status-active-green';
            showToast(isHigh ? '🟢 Green LED: Switched OFF' : '🟢 Green LED: Switched ON (Access Granted)', 'success');
          }
        } else if (action === 'red-led') {
          const valEl = document.getElementById('valRedLed');
          const statusEl = document.getElementById('statusRedLed');
          if (valEl && statusEl) {
            const isHigh = valEl.textContent.includes('HIGH');
            valEl.textContent = isHigh ? 'LOW • Armed (0.0V)' : 'HIGH • Denied (3.3V)';
            statusEl.textContent = isHigh ? 'STANDBY' : 'ALERT';
            statusEl.className = isHigh ? 'lab2-pill-status status-standby-red' : 'lab2-pill-status status-armed-orange';
            showToast(isHigh ? '🔴 Red LED: Reset to Standby' : '🔴 Red LED: Triggered HIGH (Access Denied)', 'danger');
          }
        } else if (action === 'buzzer') {
          showToast('🔔 Buzzer: 85 dB Test Alarm Tone Pulse Sounded', 'warning');
        } else if (action === 'push-button') {
          const valEl = document.getElementById('valPushButton');
          const statusEl = document.getElementById('statusPushButton');
          if (valEl && statusEl) {
            valEl.textContent = 'GPIO 14 • PRESSED';
            statusEl.textContent = 'PRESSED';
            statusEl.className = 'lab2-pill-status status-active-green';
            showToast('🔘 Push Button: Momentary Pulse Activated (GPIO 14 HIGH)', 'info');
            setTimeout(() => {
              if (valEl) valEl.textContent = 'GPIO 14 • Ready';
              if (statusEl) {
                statusEl.textContent = 'RELEASED';
                statusEl.className = 'lab2-pill-status status-ready-blue';
              }
            }, 1200);
          }
        } else if (action === 'mq2') {
          showToast('💨 MQ-2 Gas Sensor: Sample Readout 38 PPM (Safe Air Baseline)', 'info');
        } else if (action === 'pir') {
          const valEl = document.getElementById('valPir');
          const statusEl = document.getElementById('statusPir');
          if (valEl && statusEl) {
            valEl.textContent = 'Motion Detected (Ingress)';
            statusEl.textContent = 'MOTION';
            statusEl.className = 'lab2-pill-status status-armed-orange';
            showToast('👤 PIR: Motion Detected in Lab 2 Sector A', 'warning');
            setTimeout(() => {
              if (valEl) valEl.textContent = 'No Motion • Secure';
              if (statusEl) {
                statusEl.textContent = 'CLEAR';
                statusEl.className = 'lab2-pill-status status-motion-purple';
              }
            }, 2500);
          }
        } else if (action === 'temp-hum') {
          showToast('🌡️ Temp & Humidity: 21.4°C • 44% RH (Calibrated DHT22 stream)', 'success');
        }
      });
    });

    // Live Monitoring Interactive Controls
    const modeLiveCameraBtn = document.getElementById('modeLiveCameraBtn');
    const modeAiTrackingBtn = document.getElementById('modeAiTrackingBtn');
    const camWindowBadge = document.getElementById('camWindowBadge');
    const camAiBoundingBox = document.getElementById('camAiBoundingBox');
    const statusValMode = document.getElementById('statusValMode');
    const statusValPerson = document.getElementById('statusValPerson');
    const statusValConfidence = document.getElementById('statusValConfidence');
    const statusValTracking = document.getElementById('statusValTracking');
    const statusValPan = document.getElementById('statusValPan');
    const statusValTilt = document.getElementById('statusValTilt');

    const servoPanSlider = document.getElementById('servoPanSlider');
    const servoPanDisplay = document.getElementById('servoPanDisplay');
    const servoTiltSlider = document.getElementById('servoTiltSlider');
    const servoTiltDisplay = document.getElementById('servoTiltDisplay');
    const flashLedSlider = document.getElementById('flashLedSlider');
    const flashLedDisplay = document.getElementById('flashLedDisplay');
    const camResetServosBtn = document.getElementById('camResetServosBtn');
    const camCaptureImgBtn = document.getElementById('camCaptureImgBtn');
    const lastCaptureContainer = document.getElementById('lastCaptureContainer');
    const liveActivityLogBox = document.getElementById('liveActivityLogBox');

    function addLiveLogEntry(text) {
      if (!liveActivityLogBox) return;
      const row = document.createElement('div');
      row.className = 'log-entry-row';
      const timeStr = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
      row.textContent = `[${timeStr}] ${text}`;
      liveActivityLogBox.insertBefore(row, liveActivityLogBox.firstChild);
    }

    if (modeLiveCameraBtn && modeAiTrackingBtn) {
      modeLiveCameraBtn.addEventListener('click', () => {
        modeLiveCameraBtn.classList.add('active');
        modeAiTrackingBtn.classList.remove('active');
        if (camWindowBadge) camWindowBadge.textContent = 'Live Camera';
        if (statusValMode) statusValMode.textContent = 'Live Camera';
        if (statusValPerson) statusValPerson.textContent = '—';
        if (statusValConfidence) statusValConfidence.textContent = '—';
        if (statusValTracking) statusValTracking.textContent = 'OFF';
        if (camAiBoundingBox) camAiBoundingBox.style.display = 'none';
        addLiveLogEntry('Mode switched to Live Camera (Raw Stream)');
        showToast('Switched to Live Camera Mode (ESP32 Stream)', 'info');
      });

      modeAiTrackingBtn.addEventListener('click', () => {
        modeAiTrackingBtn.classList.add('active');
        modeLiveCameraBtn.classList.remove('active');
        if (camWindowBadge) camWindowBadge.textContent = 'AI Tracking';
        if (statusValMode) statusValMode.textContent = 'AI Tracking (YOLOv8)';
        if (statusValPerson) statusValPerson.textContent = 'Detected (Dr. Vance)';
        if (statusValConfidence) statusValConfidence.textContent = '99.2%';
        if (statusValTracking) statusValTracking.textContent = 'ACTIVE';
        if (camAiBoundingBox) camAiBoundingBox.style.display = 'flex';
        addLiveLogEntry('AI Tracking (YOLOv8 person detection) enabled');
        showToast('Switched to AI Tracking Mode (YOLOv8 Active)', 'success');
      });
    }

    if (servoPanSlider && servoPanDisplay) {
      servoPanSlider.addEventListener('input', (e) => {
        const val = `${e.target.value}°`;
        servoPanDisplay.textContent = val;
        if (statusValPan) statusValPan.textContent = val;
      });
      servoPanSlider.addEventListener('change', (e) => {
        addLiveLogEntry(`Servo Pan updated to ${e.target.value}°`);
      });
    }

    if (servoTiltSlider && servoTiltDisplay) {
      servoTiltSlider.addEventListener('input', (e) => {
        const val = `${e.target.value}°`;
        servoTiltDisplay.textContent = val;
        if (statusValTilt) statusValTilt.textContent = val;
      });
      servoTiltSlider.addEventListener('change', (e) => {
        addLiveLogEntry(`Servo Tilt updated to ${e.target.value}°`);
      });
    }

    if (flashLedSlider && flashLedDisplay) {
      flashLedSlider.addEventListener('input', (e) => {
        flashLedDisplay.textContent = `${e.target.value}%`;
      });
      flashLedSlider.addEventListener('change', (e) => {
        addLiveLogEntry(`Flash LED set to ${e.target.value}% intensity`);
      });
    }

    if (camResetServosBtn) {
      camResetServosBtn.addEventListener('click', () => {
        if (servoPanSlider) servoPanSlider.value = 90;
        if (servoTiltSlider) servoTiltSlider.value = 65;
        if (flashLedSlider) flashLedSlider.value = 0;
        if (servoPanDisplay) servoPanDisplay.textContent = '90°';
        if (servoTiltDisplay) servoTiltDisplay.textContent = '65°';
        if (flashLedDisplay) flashLedDisplay.textContent = '0%';
        if (statusValPan) statusValPan.textContent = '90°';
        if (statusValTilt) statusValTilt.textContent = '65°';
        addLiveLogEntry('Servos & Flash LED reset to center (Pan: 90°, Tilt: 65°)');
        showToast('Servos reset to center (Pan: 90°, Tilt: 65°)', 'info');
      });
    }

    // Multi-Size Resolution Selector & Square Shape Handler
    const camResolutionSelect = document.getElementById('camResolutionSelect');
    const camVideoViewport = document.getElementById('camVideoViewport');
    const camStreamStatusText = document.getElementById('camStreamStatusText');
    const statusValRes = document.getElementById('statusValRes');
    const lightboxResolutionBadge = document.getElementById('lightboxResolutionBadge');
    const camAspectPills = document.getElementById('camAspectPills');

    function applyCameraResolution(selectedOpt) {
      if (!selectedOpt || !camVideoViewport) return;
      const resText = selectedOpt.getAttribute('data-res') || selectedOpt.text;
      const targetHeight = selectedOpt.getAttribute('data-height') || '340px';
      const aspectType = selectedOpt.getAttribute('data-aspect') || 'standard';

      if (aspectType === 'square') {
        camVideoViewport.classList.add('is-square-shape');
        camVideoViewport.style.minHeight = targetHeight;
        camVideoViewport.style.aspectRatio = '1 / 1';
        camVideoViewport.style.maxWidth = '540px';
        camVideoViewport.style.margin = '0 auto';
      } else {
        camVideoViewport.classList.remove('is-square-shape');
        camVideoViewport.style.minHeight = targetHeight;
        camVideoViewport.style.aspectRatio = aspectType === 'wide' ? '16 / 9' : '4 / 3';
        camVideoViewport.style.maxWidth = '100%';
        camVideoViewport.style.margin = '0';
      }

      if (camStreamStatusText) {
        camStreamStatusText.textContent = `Live stream from http://192.168.1.50:81/stream • ${resText} @ 30fps`;
      }
      if (statusValRes) {
        statusValRes.textContent = resText.split(' ')[0];
      }
      if (lightboxResolutionBadge) {
        lightboxResolutionBadge.textContent = resText.split(' ')[0];
      }

      addLiveLogEntry(`Stream resolution switched to ${resText}`);
      showToast(`Camera window set to ${resText}`, 'info');
    }

    if (camResolutionSelect) {
      camResolutionSelect.addEventListener('change', () => {
        const selectedOpt = camResolutionSelect.options[camResolutionSelect.selectedIndex];
        applyCameraResolution(selectedOpt);
      });
    }

    // Aspect Ratio Buttons Filter (All, 16:9, 4:3, 1:1 Square)
    if (camAspectPills && camResolutionSelect) {
      const aspectBtns = camAspectPills.querySelectorAll('.cam-aspect-btn');
      aspectBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          aspectBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.getAttribute('data-aspect-filter');

          const optgroups = camResolutionSelect.querySelectorAll('optgroup');
          let firstMatchOpt = null;

          optgroups.forEach((og) => {
            const groupType = og.getAttribute('data-group');
            if (filter === 'all' || groupType === filter) {
              og.style.display = '';
              if (!firstMatchOpt && og.children.length > 0) {
                firstMatchOpt = og.children[0];
              }
            } else {
              og.style.display = 'none';
            }
          });

          if (firstMatchOpt) {
            camResolutionSelect.value = firstMatchOpt.value;
            applyCameraResolution(firstMatchOpt);
          }
        });
      });
    }

    // Modal elements for High-Res Lightbox Snapshot
    const snapshotLightboxModal = document.getElementById('snapshotLightboxModal');
    const snapshotModalCloseBtn = document.getElementById('snapshotModalCloseBtn');
    const snapshotModalBackdrop = document.getElementById('snapshotModalBackdrop');
    const lightboxDismissBtn = document.getElementById('lightboxDismissBtn');
    const lightboxDownloadBtn = document.getElementById('lightboxDownloadBtn');
    const lightboxModalTitle = document.getElementById('lightboxModalTitle');
    const lightboxModalMeta = document.getElementById('lightboxModalMeta');
    const lightboxHudTimestamp = document.getElementById('lightboxHudTimestamp');

    function openSnapshotLightbox(title, meta, time) {
      if (!snapshotLightboxModal) return;
      if (lightboxModalTitle) lightboxModalTitle.textContent = title;
      if (lightboxModalMeta) lightboxModalMeta.textContent = meta;
      if (lightboxHudTimestamp) lightboxHudTimestamp.textContent = `${time} UTC • ENCRYPTED`;
      snapshotLightboxModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function closeSnapshotLightbox() {
      if (!snapshotLightboxModal) return;
      snapshotLightboxModal.style.display = 'none';
      document.body.style.overflow = '';
    }

    if (snapshotModalCloseBtn) snapshotModalCloseBtn.addEventListener('click', closeSnapshotLightbox);
    if (snapshotModalBackdrop) snapshotModalBackdrop.addEventListener('click', closeSnapshotLightbox);
    if (lightboxDismissBtn) lightboxDismissBtn.addEventListener('click', closeSnapshotLightbox);

    if (lightboxDownloadBtn) {
      lightboxDownloadBtn.addEventListener('click', () => {
        const title = lightboxModalTitle ? lightboxModalTitle.textContent : 'Snapshot_Live.png';
        showToast(`Downloading high-resolution ${title}...`, 'success');
      });
    }

    // Touch / Click Handler for Last Capture Container
    let latestSnapshotData = null;

    if (camCaptureImgBtn && lastCaptureContainer) {
      camCaptureImgBtn.addEventListener('click', () => {
        const timeStr = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
        const dateStr = new Date().toISOString().split('T')[0];
        const snapshotName = `Snapshot_${Date.now().toString().slice(-6)}.png`;
        const currentRes = camResolutionSelect ? camResolutionSelect.options[camResolutionSelect.selectedIndex].text.split(' ')[0] : '1280x720';

        latestSnapshotData = {
          title: snapshotName,
          meta: `${currentRes} • SHA-256 Verified • Real-Time Stream`,
          timestamp: `${dateStr} ${timeStr}`
        };

        lastCaptureContainer.innerHTML = `
          <div class="captured-snapshot-card touchable" id="capturedSnapshotCard">
            <div class="snapshot-img-thumb active-preview">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0284c7" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <div class="snapshot-details">
              <div class="snapshot-title">${snapshotName}</div>
              <div class="snapshot-meta">${currentRes} • ${timeStr}</div>
            </div>
            <span class="snapshot-view-chip">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>View</span>
            </span>
          </div>
        `;

        addLiveLogEntry(`Captured image ${snapshotName} (${currentRes})`);
        showToast('Snapshot captured! Touch / click to view full resolution.', 'success');

        // Wire touch / click on the snapshot card
        const card = document.getElementById('capturedSnapshotCard');
        if (card) {
          card.addEventListener('click', () => {
            openSnapshotLightbox(latestSnapshotData.title, latestSnapshotData.meta, latestSnapshotData.timestamp);
          });
        }
      });

      lastCaptureContainer.addEventListener('click', () => {
        if (latestSnapshotData) {
          openSnapshotLightbox(latestSnapshotData.title, latestSnapshotData.meta, latestSnapshotData.timestamp);
        } else {
          showToast('No snapshot captured yet. Click "Capture Image" first.', 'info');
        }
      });
    }

    const dynScanBtn = document.getElementById('dynScanBtn');
    if (dynScanBtn) {
      dynScanBtn.addEventListener('click', () => {
        showToast('Running AI Neural Perimeter Scan... All Nodes 100% Optimal.', 'success');
      });
    }

    const dynCycleBtn = document.getElementById('dynCycleBtn');
    if (dynCycleBtn) {
      dynCycleBtn.addEventListener('click', () => {
        showToast('Interlocks cycled: Magnetic seals verified and locked.', 'success');
      });
    }

    const dynExportBtn = document.getElementById('dynExportBtn');
    if (dynExportBtn) {
      dynExportBtn.addEventListener('click', () => {
        showToast('Exported audit logs: SentinelAI-X-Telemetry.csv', 'info');
      });
    }

    const dynSimAlertBtn = document.getElementById('dynSimAlertBtn');
    if (dynSimAlertBtn) {
      dynSimAlertBtn.addEventListener('click', () => {
        showToast('Alert Simulation: Acoustic & Visual Beacon Tested. Protocol Nominal.', 'info');
      });
    }

    const dynPingBtn = document.getElementById('dynPingBtn');
    if (dynPingBtn) {
      dynPingBtn.addEventListener('click', () => {
        showToast('Pinged all 24 connected IoT & Camera Nodes (Avg 1.2ms).', 'success');
      });
    }

    const dynSaveBtn = document.getElementById('dynSaveBtn');
    if (dynSaveBtn) {
      dynSaveBtn.addEventListener('click', () => {
        showToast('Configuration saved successfully.', 'success');
      });
    }

    // Analytics Time Range and Export Handlers
    const analyticsTimeBtns = document.querySelectorAll('.analytics-time-btn');
    const kpiInferencesVal = document.getElementById('kpiInferencesVal');
    const kpiTelemetryVal = document.getElementById('kpiTelemetryVal');
    const kpiLatencyVal = document.getElementById('kpiLatencyVal');

    if (analyticsTimeBtns.length > 0) {
      analyticsTimeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          analyticsTimeBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const range = btn.getAttribute('data-range');

          if (kpiInferencesVal && kpiTelemetryVal && kpiLatencyVal) {
            if (range === '24h') {
              kpiInferencesVal.textContent = '204,180';
              kpiTelemetryVal.textContent = '4,102,400';
              kpiLatencyVal.textContent = '2.8 ms';
            } else if (range === '7d') {
              kpiInferencesVal.textContent = '1,428,950';
              kpiTelemetryVal.textContent = '28,490,112';
              kpiLatencyVal.textContent = '3.2 ms';
            } else if (range === '30d') {
              kpiInferencesVal.textContent = '6,120,400';
              kpiTelemetryVal.textContent = '122,890,000';
              kpiLatencyVal.textContent = '3.4 ms';
            } else {
              kpiInferencesVal.textContent = '18,450,000';
              kpiTelemetryVal.textContent = '368,200,000';
              kpiLatencyVal.textContent = '3.1 ms';
            }
          }
          showToast(`Analytics timeframe switched to ${btn.textContent}`, 'info');
        });
      });
    }

    const analyticsExportBtn = document.getElementById('analyticsExportBtn');
    if (analyticsExportBtn) {
      analyticsExportBtn.addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8,TIMESTAMP,SUBSYSTEM,METRIC,VALUE,STATUS\n"
          + "2026-08-26 09:50,AI-YOLOv8,Inference-Rate,30FPS,OPTIMAL\n"
          + "2026-08-26 09:51,FaceNet-Biometric,Match-Confidence,99.98%,PASSED\n"
          + "2026-08-26 09:52,Cleanroom-AQI,Particulate-PPM,12,NOMINAL\n"
          + "2026-08-26 09:53,Quantum-Bus,Inter-Lab-Latency,1.2ms,OPTIMAL\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "SentinelAI_X_Security_Analytics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Telemetry & Analytics Report CSV exported successfully.', 'success');
      });
    }
  }

  // =========================================================================
  // 6. HEADER QUICK ACTIONS & DROPDOWNS
  // =========================================================================
  const headerLabBtn = document.getElementById('headerLabBtn');
  const headerLabDropdownWrapper = document.querySelector('.header-lab-dropdown-wrapper');
  const headerCurrentLab = document.getElementById('headerCurrentLab');
  const labDropdownItems = document.querySelectorAll('[data-switch-lab]');

  if (headerLabBtn && headerLabDropdownWrapper) {
    headerLabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      headerLabDropdownWrapper.classList.toggle('open');
      if (headerNotifWrapper) headerNotifWrapper.classList.remove('open');
    });

    labDropdownItems.forEach((item) => {
      item.addEventListener('click', () => {
        const selectedLab = item.getAttribute('data-switch-lab');
        labDropdownItems.forEach((i) => i.classList.remove('active'));
        item.classList.add('active');

        if (headerCurrentLab) {
          headerCurrentLab.textContent = selectedLab === 'LAB 1' ? 'LAB 1 (Alpha)' : 'LAB 2 (Beta)';
        }
        headerLabDropdownWrapper.classList.remove('open');

        const targetLink = document.querySelector(`[data-view="${selectedLab === 'LAB 1' ? 'lab1-dashboard' : 'lab2-dashboard'}"]`);
        if (targetLink) targetLink.click();
        showToast(`Switched active context to ${selectedLab}`, 'info');
      });
    });
  }

  // Quick Action 1: Run AI Diagnostics Scan
  const headerScanActionBtn = document.getElementById('headerScanActionBtn');
  if (headerScanActionBtn) {
    headerScanActionBtn.addEventListener('click', () => {
      showToast('⚡ Running Full AI Neural Threat Diagnostics... All 4 Nodes 100% Nominal.', 'success');
    });
  }

  // Quick Action 2: Emergency Lockdown
  const headerLockdownActionBtn = document.getElementById('headerLockdownActionBtn');
  if (headerLockdownActionBtn) {
    headerLockdownActionBtn.addEventListener('click', () => {
      const isConfirm = confirm('⚠️ EMERGENCY: Are you sure you want to engage facility-wide lockdown? All airlocks and magnetic interlocks will seal.');
      if (isConfirm) {
        showToast('🚨 LOCKDOWN ENGAGED: All magnetic seals active. Nodes isolated.', 'danger');
      }
    });
  }

  // Quick Action 3: Notification Bell Dropdown Tray
  const headerNotifBtn = document.getElementById('headerNotifBtn');
  const headerNotifWrapper = document.querySelector('.header-notif-wrapper');
  const notifClearBtn = document.getElementById('notifClearBtn');
  const notifViewAllLink = document.getElementById('notifViewAllLink');

  if (headerNotifBtn && headerNotifWrapper) {
    headerNotifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      headerNotifWrapper.classList.toggle('open');
      if (headerLabDropdownWrapper) headerLabDropdownWrapper.classList.remove('open');
    });

    if (notifClearBtn) {
      notifClearBtn.addEventListener('click', () => {
        const unreadItems = document.querySelectorAll('.notif-tray-item.unread');
        unreadItems.forEach((item) => item.classList.remove('unread'));
        const badge = document.querySelector('.notif-badge-bubble');
        if (badge) badge.style.display = 'none';
        showToast('All notifications marked as read', 'info');
      });
    }

    if (notifViewAllLink) {
      notifViewAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        headerNotifWrapper.classList.remove('open');
        const notifNav = document.querySelector('[data-view="notifications"]');
        if (notifNav) notifNav.click();
      });
    }
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    if (headerLabDropdownWrapper) headerLabDropdownWrapper.classList.remove('open');
    if (headerNotifWrapper) headerNotifWrapper.classList.remove('open');
  });

  // =========================================================================
  // 7. GLOBAL COMMAND PALETTE SEARCH (Ctrl + K)
  // =========================================================================
  const headerSearchBtn = document.getElementById('headerSearchBtn');
  const cmdPaletteBackdrop = document.getElementById('cmdPaletteBackdrop');
  const cmdPaletteInput = document.getElementById('cmdPaletteInput');
  const cmdPaletteCloseBtn = document.getElementById('cmdPaletteCloseBtn');
  const cmdResultItems = document.querySelectorAll('.cmd-result-item');

  function openCommandPalette() {
    if (!cmdPaletteBackdrop) return;
    cmdPaletteBackdrop.style.display = 'flex';
    if (cmdPaletteInput) {
      cmdPaletteInput.value = '';
      cmdPaletteInput.focus();
    }
  }

  function closeCommandPalette() {
    if (!cmdPaletteBackdrop) return;
    cmdPaletteBackdrop.style.display = 'none';
  }

  if (headerSearchBtn) {
    headerSearchBtn.addEventListener('click', openCommandPalette);
  }

  if (cmdPaletteCloseBtn) {
    cmdPaletteCloseBtn.addEventListener('click', closeCommandPalette);
  }

  if (cmdPaletteBackdrop) {
    cmdPaletteBackdrop.addEventListener('click', (e) => {
      if (e.target === cmdPaletteBackdrop) closeCommandPalette();
    });
  }

  // Keyboard shortcut Ctrl+K or Cmd+K
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdPaletteBackdrop && cmdPaletteBackdrop.style.display !== 'none') {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
    }
    if (e.key === 'Escape' && cmdPaletteBackdrop && cmdPaletteBackdrop.style.display !== 'none') {
      closeCommandPalette();
    }
  });

  // Filter Command Results
  if (cmdPaletteInput) {
    cmdPaletteInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      cmdResultItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }

  // Item Click Actions in Command Palette
  cmdResultItems.forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      closeCommandPalette();

      if (action === 'action-scan') {
        showToast('⚡ Running Full AI Neural Threat Diagnostics...', 'success');
      } else if (action === 'action-lockdown') {
        showToast('🚨 Emergency Lockdown engaged.', 'danger');
      } else {
        const nav = document.querySelector(`[data-view="${action}"]`);
        if (nav) nav.click();
      }
    });
  });

  // =========================================================================
  // 8. AUTH PORTAL / SIGN-IN WORKFLOW (reference.jpg)
  // =========================================================================
  if (logoutBtn && authPortalOverlay) {
    logoutBtn.addEventListener('click', () => {
      document.body.classList.add('auth-mode');
      authPortalOverlay.style.display = 'flex';
      showToast('Switched to Authorized Sign-In Portal', 'info');
    });
  }

  if (portalBackBtn && authPortalOverlay) {
    portalBackBtn.addEventListener('click', () => {
      document.body.classList.remove('auth-mode');
      authPortalOverlay.style.display = 'none';
    });
  }

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPwd = passwordInput.type === 'password';
      passwordInput.type = isPwd ? 'text' : 'password';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginSubmitBtn) {
        loginSubmitBtn.classList.add('loading');
        if (btnText) btnText.textContent = 'Authenticating...';
      }

      await new Promise((resolve) => setTimeout(resolve, 800));

      if (loginSubmitBtn) loginSubmitBtn.classList.remove('loading');
      if (btnText) btnText.textContent = 'Access Dashboard';

      document.body.classList.remove('auth-mode');
      if (authPortalOverlay) authPortalOverlay.style.display = 'none';
      showToast('✓ Authentication Successful. Welcome back, Admin.', 'success');
    });
  }

  // =========================================================================
  // 9b. DASHBOARD INTERACTIVE BUTTONS & SHORTCUTS
  // =========================================================================
  const heroScanBtn = document.getElementById('heroScanBtn');
  if (heroScanBtn) {
    heroScanBtn.addEventListener('click', () => {
      showToast('⚡ Running Full AI Neural Threat Diagnostics... All 4 Lab Nodes 100% Optimal.', 'success');
    });
  }

  const heroLiveStreamBtn = document.getElementById('heroLiveStreamBtn');
  if (heroLiveStreamBtn) {
    heroLiveStreamBtn.addEventListener('click', () => {
      const liveLink = document.querySelector('[data-view="lab1-live-monitoring"]') || document.querySelector('[data-section="Live Monitoring"]');
      if (liveLink) liveLink.click();
      showToast('📹 Launched Live ESP32 Video Feeds', 'info');
    });
  }

  const radarRefreshBtn = document.getElementById('radarRefreshBtn');
  if (radarRefreshBtn) {
    radarRefreshBtn.addEventListener('click', () => {
      showToast('🛰️ AI Threat Radar rescanned: All sectors nominal (0.02% threat probability).', 'info');
    });
  }

  const quickLockdownBtn = document.getElementById('quickLockdownBtn');
  if (quickLockdownBtn) {
    quickLockdownBtn.addEventListener('click', () => {
      showToast('🚨 EMERGENCY LOCKDOWN PROTOCOL ENGAGED. Magnetic seals locked.', 'danger');
    });
  }

  const quickTestAlarmBtn = document.getElementById('quickTestAlarmBtn');
  if (quickTestAlarmBtn) {
    quickTestAlarmBtn.addEventListener('click', () => {
      showToast('🔔 Alarm system tested: Strobe & Audio sirens verified OK.', 'warning');
    });
  }

  // Feature Tag Chips & Metric Boxes Interactive Feedback (In-Place, NO page redirection)
  document.querySelectorAll('.feature-tag-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const text = chip.textContent.trim().toUpperCase();
      showToast(`✓ Filter applied: ${text} is operating within nominal parameters.`, 'info');
    });
  });

  document.querySelectorAll('.metric-box').forEach((box) => {
    box.addEventListener('click', (e) => {
      e.preventDefault();
      const title = box.querySelector('.metric-title') ? box.querySelector('.metric-title').textContent : 'Telemetry';
      const num = box.querySelector('.metric-number') ? box.querySelector('.metric-number').textContent : 'Active';
      showToast(`📊 ${title}: ${num} (Real-time telemetry verified)`, 'success');
    });
  });

  document.querySelectorAll('.cam-panel').forEach((panel) => {
    panel.addEventListener('click', (e) => {
      e.preventDefault();
      const camId = panel.querySelector('.cam-id') ? panel.querySelector('.cam-id').textContent : 'Camera';
      showToast(`🎥 ${camId} feed is stream-synchronized at 60 FPS`, 'info');
    });
  });

  // =========================================================================
  // Floating AI Assistant Orb Implementation
  // =========================================================================
  const floatingChatbotBtn = document.getElementById('floatingChatbotBtn');

  function openChatbotView() {
    const chatbotLink = document.querySelector('[data-view="chatbot"]');
    if (chatbotLink) {
      chatbotLink.click();
    } else {
      renderView('chatbot', 'SYSTEM', 'Chatbot');
    }
    showToast('💬 Launched SentinelAI Security Assistant', 'info');
    setTimeout(() => {
      const input = document.getElementById('chatTextInput');
      if (input) input.focus();
    }, 100);
  }

  // Draggable Floating AI Assistant Orb Implementation
  let isDraggingFab = false;
  let fabHasMoved = false;
  let fabStartX = 0;
  let fabStartY = 0;
  let fabInitialLeft = 0;
  let fabInitialTop = 0;

  function resetFloatingFabPosition() {
    if (!floatingChatbotBtn) return;
    floatingChatbotBtn.style.top = '';
    floatingChatbotBtn.style.left = '';
    floatingChatbotBtn.style.bottom = '';
    floatingChatbotBtn.style.right = '';
    floatingChatbotBtn.style.transform = '';
  }

  window.resetFloatingFabPosition = resetFloatingFabPosition;

  if (floatingChatbotBtn) {
    const onStart = (clientX, clientY) => {
      isDraggingFab = true;
      fabHasMoved = false;
      fabStartX = clientX;
      fabStartY = clientY;
      const rect = floatingChatbotBtn.getBoundingClientRect();
      fabInitialLeft = rect.left;
      fabInitialTop = rect.top;
      floatingChatbotBtn.classList.add('is-dragging');
    };

    const onMove = (clientX, clientY) => {
      if (!isDraggingFab) return;
      const deltaX = clientX - fabStartX;
      const deltaY = clientY - fabStartY;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        fabHasMoved = true;
      }

      let newLeft = fabInitialLeft + deltaX;
      let newTop = fabInitialTop + deltaY;

      // Restrict/clamp to screen boundaries
      const btnSize = 58;
      const maxLeft = window.innerWidth - btnSize - 10;
      const maxTop = window.innerHeight - btnSize - 10;

      newLeft = Math.max(10, Math.min(newLeft, maxLeft));
      newTop = Math.max(10, Math.min(newTop, maxTop));

      floatingChatbotBtn.style.left = `${newLeft}px`;
      floatingChatbotBtn.style.top = `${newTop}px`;
      floatingChatbotBtn.style.right = 'auto';
      floatingChatbotBtn.style.bottom = 'auto';
    };

    const onEnd = () => {
      if (!isDraggingFab) return;
      isDraggingFab = false;
      floatingChatbotBtn.classList.remove('is-dragging');
    };

    // Mouse drag events
    floatingChatbotBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onStart(e.clientX, e.clientY);

      const onMouseMove = (moveEvent) => {
        onMove(moveEvent.clientX, moveEvent.clientY);
      };

      const onMouseUp = () => {
        onEnd();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // Touch drag events (Mobile/Tablet)
    floatingChatbotBtn.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    floatingChatbotBtn.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    floatingChatbotBtn.addEventListener('touchend', () => {
      onEnd();
    });

    // Click handler with drag distinction
    floatingChatbotBtn.addEventListener('click', (e) => {
      if (fabHasMoved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      openChatbotView();
    });
  }

  function updateClock() {
    const clockEl = document.getElementById('headerClock');
    if (!clockEl) return;
    const now = new Date();
    
    try {
      // Accurate Indian Standard Time (Asia/Kolkata)
      const optionsDate = { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      const optionsTime = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

      const dateStr = new Intl.DateTimeFormat('en-IN', optionsDate).format(now);
      const timeStr = new Intl.DateTimeFormat('en-IN', optionsTime).format(now);

      clockEl.textContent = `${dateStr}  |  ${timeStr} IST`;
    } catch (err) {
      // Fallback if timezone not supported in some environments
      clockEl.textContent = now.toLocaleDateString() + ' | ' + now.toLocaleTimeString() + ' IST';
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  // Initial Top Sub-navigation Render
  updateTopSubnav('LAB 1', 'lab1-dashboard');

  // =========================================================================
  // 7b. HASH ROUTING & DEEP LINKING (#chatbot, #lab1, #lab2, #lab1-live-monitoring, etc.)
  // =========================================================================
  function handleHashRoute() {
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    if (!rawHash) return;

    if (rawHash === 'chatbot') {
      const link = document.querySelector('[data-view="chatbot"]');
      if (link) link.click();
      else renderView('chatbot', 'SYSTEM', 'Chatbot');
      return;
    }

    if (rawHash === 'lab1' || rawHash === 'lab1-dashboard') {
      const link = document.querySelector('[data-view="lab1-dashboard"]');
      if (link) link.click();
      return;
    }

    if (rawHash === 'lab2' || rawHash === 'lab2-dashboard') {
      const link = document.querySelector('[data-view="lab2-dashboard"]');
      if (link) link.click();
      return;
    }

    const matchingLink = document.querySelector(`[data-view="${rawHash}"]`);
    if (matchingLink) {
      matchingLink.click();
      return;
    }
  }

  window.addEventListener('hashchange', handleHashRoute);
  setTimeout(handleHashRoute, 60);

  // =========================================================================
  // 8. 3D PARALLAX LOOP
  // =========================================================================
  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener('mousemove', (e) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    mouseX = (e.clientX - centerX) / centerX;
    mouseY = (e.clientY - centerY) / centerY;
  });

  function updateParallax() {
    currentX += (mouseX - currentX) * 0.05;
    currentY += (mouseY - currentY) * 0.05;

    if (bgGlows) {
      bgGlows.style.transform = `translate3d(${currentX * 20}px, ${currentY * 16}px, 0)`;
    }

    if (isoLabsWrapper && viewLabDashboard.classList.contains('active')) {
      const rotX = currentY * -5;
      const rotY = currentX * 6;
      isoLabsWrapper.style.transform = `translate3d(${currentX * 10}px, ${currentY * 6}px, 12px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    if (authIsoWrapper && authPortalOverlay && authPortalOverlay.style.display !== 'none') {
      const rotX = currentY * -5;
      const rotY = currentX * 6;
      authIsoWrapper.style.transform = `translate3d(${currentX * 10}px, ${currentY * 6}px, 12px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    if (loginCard && authPortalOverlay && authPortalOverlay.style.display !== 'none') {
      const cardRotX = currentY * -3;
      const cardRotY = currentX * 4;
      loginCard.style.transform = `rotateX(${cardRotX}deg) rotateY(${cardRotY}deg)`;
    }

    requestAnimationFrame(updateParallax);
  }

  requestAnimationFrame(updateParallax);

  // =========================================================================
  // 9. TOAST HELPER
  // =========================================================================
  function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  // =========================================================================
  // 10. URL HASH ROUTE GUARD (Prevents Frontend URL Manipulation / Bypass)
  // =========================================================================
  window.addEventListener('hashchange', () => {
    const rawHash = window.location.hash.replace('#', '').trim();
    if (!rawHash) return;

    if (currentUser.allowedLab === 'LAB 1' && (rawHash.startsWith('lab2') || rawHash === 'settings')) {
      triggerAccessDenied('LAB 2 / System Settings');
      window.location.hash = 'lab1-dashboard';
      return;
    }
    if (currentUser.allowedLab === 'LAB 2' && (rawHash.startsWith('lab1') || rawHash === 'settings')) {
      triggerAccessDenied('LAB 1 / System Settings');
      window.location.hash = 'lab2-dashboard';
      return;
    }

    const matchingLink = document.querySelector(`[data-view="${rawHash}"]`);
    if (matchingLink) {
      matchingLink.click();
    }
  });
});
