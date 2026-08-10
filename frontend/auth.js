/* =====================================================
   WhyStock AI — auth.js
   Backend authentication + JWT session
   ===================================================== */


// =====================================================
// API CONFIGURATION
// =====================================================

const AUTH_API_BASE =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "https://whystock-ai.onrender.com";


// =====================================================
// STORAGE
// =====================================================

const STORAGE_KEYS = {
  SESSION: "whystock_session"
};


// =====================================================
// SESSION
// =====================================================

function getSession() {
  try {
    const raw = localStorage.getItem(
      STORAGE_KEYS.SESSION
    );

    if (!raw) return null;

    const session = JSON.parse(raw);

    if (
      session.expiresAt &&
      Date.now() > session.expiresAt
    ) {
      clearSession();
      return null;
    }

    return session;

  } catch (error) {
    console.error(
      "[WhyStock] Failed to read session:",
      error
    );

    return null;
  }
}


function createSession(data) {

  if (
    !data ||
    !data.token ||
    !data.user
  ) {
    console.error(
      "[WhyStock] Invalid authentication response"
    );

    return null;
  }

  const session = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    token: data.token,
    createdAt: Date.now(),
    expiresAt:
      Date.now() +
      24 * 60 * 60 * 1000
  };

  localStorage.setItem(
    STORAGE_KEYS.SESSION,
    JSON.stringify(session)
  );

  return session;
}


function clearSession() {
  localStorage.removeItem(
    STORAGE_KEYS.SESSION
  );
}


// =====================================================
// SIGNUP API
// =====================================================

async function signupUser(
  name,
  email,
  password
) {

  const response = await fetch(
    `${AUTH_API_BASE}/auth/signup`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password
      })
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail ||
      `HTTP ${response.status}`
    );
  }

  return data;
}


// =====================================================
// LOGIN API
// =====================================================

async function loginUser(
  email,
  password
) {

  const response = await fetch(
    `${AUTH_API_BASE}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password
      })
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail ||
      `HTTP ${response.status}`
    );
  }

  createSession(data);

  return data;
}


// =====================================================
// AUTHORIZATION
// =====================================================

function getAuthHeaders() {

  const session = getSession();

  if (
    !session ||
    !session.token
  ) {
    return {};
  }

  return {
    Authorization:
      `Bearer ${session.token}`
  };
}


function isLoggedIn() {

  const session = getSession();

  return !!(
    session &&
    session.token
  );
}


function getCurrentUser() {

  const session = getSession();

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    name: session.name,
    email: session.email
  };
}


// =====================================================
// LOGOUT
// =====================================================

function logoutUser() {

  clearSession();

  window.location.href =
    "login.html";
}


// =====================================================
// UI HELPERS
// =====================================================

function showFieldError(
  id,
  msg
) {

  const el =
    document.getElementById(id);

  if (el) {
    el.textContent = msg;
  }
}


function showAuthError(msg) {

  const banner =
    document.getElementById(
      "authError"
    );

  const msgEl =
    document.getElementById(
      "authErrorMsg"
    );

  if (
    banner &&
    msgEl
  ) {

    msgEl.textContent = msg;

    banner.classList.remove(
      "hidden"
    );

    banner.style.animation =
      "none";

    void banner.offsetHeight;

    banner.style.animation =
      "fadeUp 0.3s ease both";
  }
}


function clearErrors() {

  document
    .querySelectorAll(".field-error")
    .forEach(
      el => {
        el.textContent = "";
      }
    );


  const banner =
    document.getElementById(
      "authError"
    );

  if (banner) {
    banner.classList.add(
      "hidden"
    );
  }


  document
    .querySelectorAll(".field-input")
    .forEach(el => {

      el.style.animation = "";
      el.style.borderColor = "";
      el.style.boxShadow = "";

    });
}


function togglePw(
  inputId,
  btn
) {

  const input =
    document.getElementById(
      inputId
    );

  if (!input) return;

  if (
    input.type === "password"
  ) {

    input.type = "text";

    btn.textContent =
      "Hide";

  } else {

    input.type = "password";

    btn.textContent =
      "Show";
  }
}


function setLoading(
  btn,
  isLoading
) {

  if (!btn) return;

  const label =
    btn.querySelector(
      ".btn-label"
    );

  const icon =
    btn.querySelector(
      ".btn-icon"
    );


  if (isLoading) {

    btn.disabled = true;

    if (label) {
      label.textContent =
        "Please wait...";
    }

    if (icon) {
      icon.textContent = "⟳";
    }

    btn.style.opacity =
      "0.75";

  } else {

    btn.disabled = false;

    if (label) {
      label.textContent =
        btn.dataset.origLabel ||
        "Submit";
    }

    if (icon) {
      icon.textContent = "→";
    }

    btn.style.opacity =
      "1";
  }
}


// =====================================================
// LOGIN FORM
// =====================================================

async function handleLogin(event) {

  event.preventDefault();

  clearErrors();


  const emailInput =
    document.getElementById(
      "loginEmail"
    );

  const passwordInput =
    document.getElementById(
      "loginPassword"
    );

  const loginBtn =
    document.getElementById(
      "loginBtn"
    );


  const email =
    emailInput?.value.trim();

  const password =
    passwordInput?.value || "";


  let valid = true;


  if (!email) {

    showFieldError(
      "emailErr",
      "Email is required"
    );

    valid = false;
  }


  if (!password) {

    showFieldError(
      "pwErr",
      "Password is required"
    );

    valid = false;
  }


  if (!valid) {
    return;
  }


  setLoading(
    loginBtn,
    true
  );


  try {

    const data =
      await loginUser(
        email,
        password
      );


    if (
      !data ||
      !data.success
    ) {
      throw new Error(
        "Login failed"
      );
    }


    window.location.href =
      "index.html";


  } catch (error) {

    console.error(
      "[WhyStock] Login error:",
      error
    );

    showAuthError(
      error.message ||
      "Invalid email or password"
    );


  } finally {

    setLoading(
      loginBtn,
      false
    );
  }
}


// =====================================================
// SIGNUP FORM
// =====================================================

async function handleSignup(event) {

  event.preventDefault();

  clearErrors();


  const name =
    document.getElementById(
      "signupName"
    )?.value.trim();

  const email =
    document.getElementById(
      "signupEmail"
    )?.value.trim();

  const password =
    document.getElementById(
      "signupPassword"
    )?.value || "";

  const confirm =
    document.getElementById(
      "signupConfirm"
    )?.value || "";

  const signupBtn =
    document.getElementById(
      "signupBtn"
    );


  let valid = true;


  // ---------------------------------------------
  // VALIDATION
  // ---------------------------------------------

  if (
    !name ||
    name.length < 2
  ) {

    showFieldError(
      "nameErr",
      "Enter your full name"
    );

    valid = false;
  }


  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {

    showFieldError(
      "emailErr",
      "Enter a valid email address"
    );

    valid = false;
  }


  if (
    !password ||
    password.length < 6
  ) {

    showFieldError(
      "pwErr",
      "Password must be at least 6 characters"
    );

    valid = false;
  }


  if (
    password !== confirm
  ) {

    showFieldError(
      "confirmErr",
      "Passwords do not match"
    );

    valid = false;
  }


  if (!valid) {
    return;
  }


  // ---------------------------------------------
  // CREATE ACCOUNT
  // ---------------------------------------------

  setLoading(
    signupBtn,
    true
  );


  try {

    await signupUser(
      name,
      email,
      password
    );


    // Automatically log in after signup
    const loginData =
      await loginUser(
        email,
        password
      );


    if (
      !loginData ||
      !loginData.success
    ) {
      throw new Error(
        "Account created, but login failed"
      );
    }


    window.location.href =
      "index.html";


  } catch (error) {

    console.error(
      "[WhyStock] Signup error:",
      error
    );


    showAuthError(
      error.message ||
      "Unable to create account"
    );


  } finally {

    setLoading(
      signupBtn,
      false
    );
  }
}


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    document
      .querySelectorAll(
        ".btn-primary"
      )
      .forEach(btn => {

        const label =
          btn.querySelector(
            ".btn-label"
          );

        if (label) {
          btn.dataset.origLabel =
            label.textContent;
        }

      });

  }
);