// helper to load Google Identity Services and initialize a callback
const loadGoogleScript = () => new Promise((resolve, reject) => {
  if (window.google && window.google.accounts && window.google.accounts.id) return resolve(window.google);
  const existing = document.querySelector('script[data-google-identity]');
  if (existing) {
    existing.addEventListener('load', () => resolve(window.google));
    existing.addEventListener('error', reject);
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.setAttribute('data-google-identity', '1');
  script.onload = () => resolve(window.google);
  script.onerror = reject;
  document.head.appendChild(script);
});

let initialized = false;
let clientIdGlobal = null;

export async function initGoogleIdentity(clientId, callback) {
  if (!clientId) throw new Error('initGoogleIdentity requires clientId');
  clientIdGlobal = clientId;
  await loadGoogleScript();
  // initialize once
  if (!initialized && window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp) => {
        // resp.credential is the ID token
        callback && callback(resp);
      },
    });
    initialized = true;
  }
  return initialized;
}

export function promptGoogle() {
  if (!initialized || !window.google || !window.google.accounts || !window.google.accounts.id) {
    throw new Error('Google Identity not initialized');
  }
  // show the One Tap / prompt (if allowed) or the chooser
  window.google.accounts.id.prompt();
}

export function renderGoogleButton(elementId, options = {}) {
  if (!initialized) throw new Error('Google Identity not initialized');
  window.google.accounts.id.renderButton(document.getElementById(elementId), options);
}

export function revokeToken(token, clientId) {
  // revoke is optional: can ask Google to revoke token if necessary
  try {
    if (!token || !clientId) return;
    fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
  } catch (err) { /* ignore */ }
}

export default { initGoogleIdentity, promptGoogle, renderGoogleButton, revokeToken };
