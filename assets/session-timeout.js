// ---------- CONFIG ----------
const BROWSING_INACTIVITY_MIN = 30;   // browsing/analytics inactivity
const LOGIN_MAX_MIN = 5;        // max logged-in time (~24h)
const WARNING_MIN_BEFORE_LOGOUT = 1;  // show modal 5 min before logout

// Keys for localStorage
const LS_KEYS = {
  lastActivity: 'shop_session_last_activity',
  loginStartedAt: 'shop_login_started_at',
};

// ---------- HELPERS ----------
function nowMs() {
  return Date.now();
}

function getMinutesSince(ts) {
  if (!ts) return Infinity;
  return (nowMs() - Number(ts)) / 1000 / 60;
}

function getEl(id) {
  return document.getElementById(id);
}

function isLoggedIn() {
  // Simple heuristic: Shopify sets this variable in some themes,
  // or you can inject it via Liquid.
  // Safer: inject via Liquid:
  // <script>window.__customerLoggedIn = {{ customer ? 'true' : 'false' }};</script>
  return window.isCustomerLoggedIn;
}

// ---------- STATE INIT ----------
function initTimestamps() {
  const now = nowMs();

  // Always update last activity on page load
  localStorage.setItem(LS_KEYS.lastActivity, String(now));

  // If logged in and no login start recorded yet, set it
  if (isLoggedIn() && !localStorage.getItem(LS_KEYS.loginStartedAt)) {
    localStorage.setItem(LS_KEYS.loginStartedAt, String(now));
  }

  // If not logged in, clear login timing
  if (!isLoggedIn()) {
    localStorage.removeItem(LS_KEYS.loginStartedAt);
  }
}

// ---------- ACTIVITY TRACKING ----------
function bindActivityListeners() {
  const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
  const updateActivity = () => {
    localStorage.setItem(LS_KEYS.lastActivity, String(nowMs()));
  };

  activityEvents.forEach((evt) => {
    window.addEventListener(evt, updateActivity, { passive: true });
  });
}

// ---------- MODAL UX ----------
function showWarningModal() {
  const overlay = getEl('session-timeout-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
}

function hideWarningModal() {
  const overlay = getEl('session-timeout-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
}

function bindModalButtons() {
  const stayBtn = getEl('session-timeout-stay');
  const signoutBtn = getEl('session-timeout-signout');

  if (stayBtn) {
    stayBtn.addEventListener('click', () => {
      // user confirms they are still here
      localStorage.setItem(LS_KEYS.lastActivity, String(nowMs()));
      hideWarningModal();
    });
  }

  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      hideWarningModal();
      // Redirect through Shopify logout then back to login/home
      window.location.href = '/account/logout?return_url=/account/login';
    });
  }
}

// ---------- MAIN TIMER LOOP ----------
function startTimerLoop() {
  setInterval(() => {
    const lastActivity = localStorage.getItem(LS_KEYS.lastActivity);
    const loginStartedAt = localStorage.getItem(LS_KEYS.loginStartedAt);

    const inactiveMinutes = getMinutesSince(lastActivity);
    const loginMinutes = getMinutesSince(loginStartedAt);

    // 1) Browsing inactivity: send analytics / reset personalization (client-side only)
    if (inactiveMinutes > BROWSING_INACTIVITY_MIN) {
      // Example hook: window.dataLayer.push({event: 'session_inactive'});
      // You can also clear personalization state here.
      // This is silent, no UX required.
    }
    console.log("isLoggedIn");
    // 2) Logged-in max session time + warning
    if (isLoggedIn()) {
       console.log("loggedin");
      const minutesLeft = LOGIN_MAX_MIN - loginMinutes;
      console.log("LOGIN_MAX_MIN");
      console.log(LOGIN_MAX_MIN);
      console.log("loginMinutes");
      console.log(loginMinutes);
      console.log("minutesLeft");
      console.log(minutesLeft);
      // Show warning when close to logout
      if (minutesLeft <= WARNING_MIN_BEFORE_LOGOUT && minutesLeft > 0) {
        showWarningModal();
      }

      // Hard logout: redirect when exceeded
      if (minutesLeft <= 0) {
        hideWarningModal();
        window.location.href = '/account/logout?return_url=/account/login';
      }
    } else {
      console.log("ot loggedin");
      console.log(isLoggedIn());
      hideWarningModal();
    }
  }, 30 * 1000); // check every 30 seconds
}

// ---------- BOOTSTRAP ----------
document.addEventListener('DOMContentLoaded', function () {
  // Inject logged in flag from Liquid (add this in theme.liquid head):
  // <script>window.__customerLoggedIn = {{ customer ? 'true' : 'false' }};</script>

  initTimestamps();
  bindActivityListeners();
  bindModalButtons();
  startTimerLoop();
});