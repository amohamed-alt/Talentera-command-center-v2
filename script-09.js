(function() {
  const AUTH_STORAGE_KEY = "talentera_dashboard_auth_v2";
  const AUTH_ATTEMPTS_KEY = "talentera_dashboard_auth_attempts_v2";
  const AUTH_LOCK_KEY = "talentera_dashboard_auth_lock_v2";
  const AUTH_HASH = "20e288b32e5a89cc6f81b212a20214fdc7306a5fb6bf0554b55c9f747a6d6a25"; // SHA-256 of: Acqret2026
  const MAX_ATTEMPTS = 5;
  const LOCK_SECONDS = 30;
  const SESSION_DAYS = 30;

  async function sha256Hex(text) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,"0")).join("");
  }

  function now() {
    return Date.now();
  }

  function getSavedAuth() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }

  function isAuthenticated() {
    const auth = getSavedAuth();
    if (!auth || auth.status !== "ok" || !auth.expiresAt) return false;
    if (now() > Number(auth.expiresAt)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }
    return true;
  }

  function saveAuthenticated() {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      status: "ok",
      createdAt: now(),
      expiresAt: now() + SESSION_DAYS * 24 * 60 * 60 * 1000
    }));
    localStorage.removeItem(AUTH_ATTEMPTS_KEY);
    localStorage.removeItem(AUTH_LOCK_KEY);
  }

  function unlockDashboard() {
    document.body.classList.remove("auth-locked");
    const gate = document.getElementById("authGate");
    if (gate) gate.classList.add("auth-hidden");
  }

  function showAuthError(message) {
    const error = document.getElementById("authError");
    if (!error) return;
    error.textContent = message || "Incorrect password. Please try again.";
    error.classList.add("show");
  }

  function hideAuthError() {
    const error = document.getElementById("authError");
    if (error) error.classList.remove("show");
  }

  function getLockRemainingSeconds() {
    const lockedUntil = Number(localStorage.getItem(AUTH_LOCK_KEY) || 0);
    if (!lockedUntil || now() >= lockedUntil) return 0;
    return Math.ceil((lockedUntil - now()) / 1000);
  }

  function registerFailedAttempt() {
    const attempts = Number(localStorage.getItem(AUTH_ATTEMPTS_KEY) || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(AUTH_LOCK_KEY, String(now() + LOCK_SECONDS * 1000));
      localStorage.setItem(AUTH_ATTEMPTS_KEY, "0");
      return { locked: true, remaining: LOCK_SECONDS };
    }
    localStorage.setItem(AUTH_ATTEMPTS_KEY, String(attempts));
    return { locked: false, attemptsLeft: MAX_ATTEMPTS - attempts };
  }

  document.addEventListener("DOMContentLoaded", function() {
    if (isAuthenticated()) {
      unlockDashboard();
      return;
    }

    const form = document.getElementById("authForm");
    const input = document.getElementById("authPassword");
    const toggle = document.getElementById("authToggle");

    setTimeout(() => input && input.focus(), 120);

    if (toggle && input) {
      toggle.addEventListener("click", function() {
        input.type = input.type === "password" ? "text" : "password";
        toggle.textContent = input.type === "password" ? "👁️" : "🙈";
        input.focus();
      });
    }

    if (input) {
      input.addEventListener("input", hideAuthError);
    }

    if (form && input) {
      form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const lockedFor = getLockRemainingSeconds();
        if (lockedFor > 0) {
          showAuthError(`Too many attempts. Try again in ${lockedFor} seconds.`);
          return;
        }

        const typedHash = await sha256Hex(input.value || "");
        if (typedHash === AUTH_HASH) {
          saveAuthenticated();
          unlockDashboard();
        } else {
          input.value = "";
          input.focus();
          const result = registerFailedAttempt();
          if (result.locked) {
            showAuthError(`Too many attempts. Try again in ${result.remaining} seconds.`);
          } else {
            showAuthError(`Incorrect password. ${result.attemptsLeft} attempt(s) left before temporary lock.`);
          }
        }
      });
    }
  });
})();
