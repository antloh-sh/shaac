// auth-config.js - Centralized Security & Auth
const SUPABASE_URL = 'https://qesgfxwgbggjyvngftee.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MJQrnWCSsg0naLA9hxkPzQ__diYSGYi';

// Use sessionStorage so closing the tab logs the user out
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        storage: window.sessionStorage
    }
});

let idleTimer;

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(autoLogout, 900000); // 15 minutes
}

async function autoLogout() {
    console.log("Inactivity logout triggered.");
    await signOut();
}

async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
}

// FIX #8a: replaced deprecated onkeypress with onkeydown
// FIX #8b: use addEventListener instead of window.on* assignment
//          to avoid silently overwriting other handlers
window.addEventListener('mousemove',  resetIdleTimer);
window.addEventListener('mousedown',  resetIdleTimer);
window.addEventListener('touchstart', resetIdleTimer);
window.addEventListener('click',      resetIdleTimer);
window.addEventListener('keydown',    resetIdleTimer);
