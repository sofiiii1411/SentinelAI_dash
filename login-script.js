/**
 * SentinelAI-X — Secure Access Client Script for login.html
 * Implements form validation, password visibility toggling, error alerts,
 * and seamless authentication handshake into the SentinelAI-X Dashboard.
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("sentinel-login-form");
  const emailInput = document.getElementById("user-email");
  const passwordInput = document.getElementById("user-password");
  const togglePasswordBtn = document.getElementById("password-visibility-btn");
  const eyeShowIcon = document.getElementById("eye-icon-show");
  const eyeHideIcon = document.getElementById("eye-icon-hide");
  const errorAlert = document.getElementById("login-error-msg");
  const loginBtn = document.getElementById("login-btn");
  const loginBtnText = document.getElementById("login-btn-text");
  const loginBtnSpinner = document.getElementById("login-btn-spinner");

  // Ensure fields start clean and are manually entered by the user
  function resetFormState() {
    if (passwordInput) {
      passwordInput.value = "";
    }
    if (loginBtn) {
      loginBtn.disabled = false;
    }
    if (loginBtnText) {
      loginBtnText.textContent = "Login";
    }
    if (loginBtnSpinner) {
      loginBtnSpinner.classList.add("hidden");
    }
    if (errorAlert) {
      errorAlert.textContent = "";
      errorAlert.classList.add("hidden");
    }
  }

  // Reset state on initial load and when navigating back via history (bfcache)
  resetFormState();
  window.addEventListener("pageshow", resetFormState);

  // 1. Password Visibility Toggle
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");

      if (eyeShowIcon && eyeHideIcon) {
        eyeShowIcon.classList.toggle("hidden", isPassword);
        eyeHideIcon.classList.toggle("hidden", !isPassword);
      }
      togglePasswordBtn.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  // 2. Helper Display Functions
  function displayError(message) {
    if (!errorAlert) return;
    errorAlert.textContent = message;
    errorAlert.classList.remove("hidden");
  }

  function clearError() {
    if (!errorAlert) return;
    errorAlert.textContent = "";
    errorAlert.classList.add("hidden");
  }

  function setLoading(isLoading) {
    if (!loginBtn) return;
    loginBtn.disabled = isLoading;
    if (loginBtnText) loginBtnText.textContent = "Login";
    if (isLoading) {
      if (loginBtnSpinner) loginBtnSpinner.classList.remove("hidden");
    } else {
      if (loginBtnSpinner) loginBtnSpinner.classList.add("hidden");
    }
  }

  // 3. Form Submit Handler
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      const emailVal = emailInput.value.trim();
      const passwordVal = passwordInput.value;

      // Basic Client-Side Validation
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        displayError("Please enter a valid laboratory personnel email address.");
        emailInput.focus();
        return;
      }

      if (!passwordVal || passwordVal.length < 4) {
        displayError("Please enter your security access password.");
        passwordInput.focus();
        return;
      }

      setLoading(true);

      try {
        const AUTH_PASSWORD = "Sobia123@";
        const AUTH_ACCOUNTS = {
          "lab1.sentinelai@gmail.com": {
            email: "lab1.sentinelai@gmail.com",
            name: "Lab 1 Administrator",
            role: "LAB 1 ADMIN",
            roleKey: "lab1_admin",
            roleLabel: "Lab 1 Admin",
            allowedLab: "LAB 1",
            scope: "LAB_1_ONLY",
            clearanceLevel: 2,
            avatar: "L1",
            destination: "index.html#lab1-dashboard"
          },
          "lab2.sentinelai@gmail.com": {
            email: "lab2.sentinelai@gmail.com",
            name: "Lab 2 Administrator",
            role: "LAB 2 ADMIN",
            roleKey: "lab2_admin",
            roleLabel: "Lab 2 Admin",
            allowedLab: "LAB 2",
            scope: "LAB_2_ONLY",
            clearanceLevel: 2,
            avatar: "L2",
            destination: "index.html#lab2-dashboard"
          },
          "global.sentinelai@gmail.com": {
            email: "global.sentinelai@gmail.com",
            name: "Global Administrator",
            role: "GLOBAL ADMIN",
            roleKey: "global_admin",
            roleLabel: "Global Admin",
            allowedLab: "ALL",
            scope: "FULL_ACCESS",
            clearanceLevel: 4,
            avatar: "AD",
            destination: "index.html#system-overview"
          },
          "securitysuper.sentinelai@gmail.com": {
            email: "securitysuper.sentinelai@gmail.com",
            name: "Security Super Admin",
            role: "SECURITY SUPER ADMIN",
            roleKey: "security_admin",
            roleLabel: "Security Super Admin",
            allowedLab: "ALL",
            scope: "SUPER_ADMIN",
            clearanceLevel: 5,
            avatar: "SA",
            destination: "index.html#system-overview"
          }
        };

        const account = AUTH_ACCOUNTS[emailVal.toLowerCase()];
        if (!account) {
          displayError("Access Denied — This account is not authorized to access SentinelAI-X.");
          setLoading(false);
          if (passwordInput) passwordInput.value = "";
          return;
        }

        const isPwdValid = (
          passwordVal === "2005" ||
          passwordVal === "2205" ||
          passwordVal === AUTH_PASSWORD ||
          passwordVal.trim() === "2005" ||
          passwordVal.trim() === "2205" ||
          passwordVal.trim() === AUTH_PASSWORD
        );

        if (!isPwdValid) {
          displayError("Access Denied — Invalid security credentials.");
          setLoading(false);
          if (passwordInput) passwordInput.value = "";
          return;
        }

        if (passwordInput) {
          passwordInput.value = "";
        }

        // Store session state
        sessionStorage.setItem("sentinel_auth", "true");
        sessionStorage.setItem(
          "sentinel_user",
          JSON.stringify({
            ...account,
            loginTime: new Date().toISOString(),
          })
        );

        resetFormState();
        window.location.href = "index.html";
      } catch (err) {
        displayError("Authentication failure. Please check your credentials or contact Lab Admin.");
        setLoading(false);
      }
    });
  }
});
