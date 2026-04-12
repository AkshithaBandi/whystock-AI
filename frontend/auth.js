/* =====================================================
   WhyStock AI — auth.js
   localStorage-based authentication helpers
   ===================================================== */

const STORAGE_KEYS = {
  USERS:   'whystock_users',
  SESSION: 'whystock_session',
};

// ── User store ──────────────────────────────────────

/** Return all registered users */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch {
    return [];
  }
}

/** Find a user by email (case-insensitive) */
function getUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/** Persist a new user */
function saveUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// ── Session ─────────────────────────────────────────

/** Return the current session object (or null) */
function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Simple expiry check (24 hours)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/** Create a session for a user */
function createSession(user) {
  const session = {
    name:      user.name,
    email:     user.email,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
    token:     btoa(user.email + ':' + Date.now()),
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/** Destroy the current session */
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// ── UI helpers ──────────────────────────────────────

/** Show an inline field error */
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

/** Show the auth-level error banner */
function showAuthError(msg) {
  const banner = document.getElementById('authError');
  const msgEl  = document.getElementById('authErrorMsg');
  if (banner && msgEl) {
    msgEl.textContent = msg;
    banner.classList.remove('hidden');
    banner.style.animation = 'none';
    void banner.offsetHeight;
    banner.style.animation = 'fadeUp 0.3s ease both';
  }
}

/** Clear all errors on the page */
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  const banner = document.getElementById('authError');
  if (banner) banner.classList.add('hidden');
  // Reset any shaking inputs
  document.querySelectorAll('.field-input').forEach(el => {
    el.style.animation = '';
    el.style.borderColor = '';
    el.style.boxShadow = '';
  });
}

/** Toggle password visibility */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

/** Set a button to loading / normal state */
function setLoading(btn, isLoading) {
  if (!btn) return;
  const label = btn.querySelector('.btn-label');
  const icon  = btn.querySelector('.btn-icon');
  if (isLoading) {
    btn.disabled = true;
    if (label) label.textContent = 'Please wait…';
    if (icon)  icon.textContent  = '⟳';
    btn.style.opacity = '0.75';
  } else {
    btn.disabled = false;
    if (label) label.textContent = btn.dataset.origLabel || 'Submit';
    if (icon)  icon.textContent  = '→';
    btn.style.opacity = '1';
  }
}

// Store original button labels on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-primary').forEach(btn => {
    const label = btn.querySelector('.btn-label');
    if (label) btn.dataset.origLabel = label.textContent;
  });
});