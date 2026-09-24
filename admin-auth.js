/**
 * admin-auth.js — Authentication & Session Management for Flute Notation Admin
 *
 * Uses Supabase Auth to securely authenticate administrators.
 * No hardcoded passwords, no fake logins, and no credentials in localStorage.
 */

'use strict';

const SUPABASE_PROJECT_URL = 'https://kjmqfkhngvuvivtqmjko.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EN8LhNtlouiD9fkAZ8QF-g_Amo1OU0Q';

let _adminSupabase = null;

/**
 * Get or initialize the Supabase client instance
 */
function getAdminSupabase() {
  if (_adminSupabase) return _adminSupabase;

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    _adminSupabase = window.supabase.createClient(
      SUPABASE_PROJECT_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
    return _adminSupabase;
  }

  console.error('[Admin Auth] Supabase SDK (@supabase/supabase-js) is not loaded.');
  return null;
}

/**
 * Check if the user is already authenticated.
 * Used on admin-login.html: if already logged in, redirect directly to admin.html.
 */
async function redirectIfLoggedIn() {
  const supabase = getAdminSupabase();
  if (!supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      window.location.replace('admin.html');
    }
  } catch (err) {
    console.warn('[Admin Auth] Session check warning:', err);
  }
}

/**
 * Sign in an administrator using Supabase Auth
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, message?: string, user?: object}>}
 */
async function loginAdmin(email, password) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Authentication service unavailable. Please check your connection.',
    };
  }

  const cleanEmail = (email || '').trim();
  const cleanPassword = password || '';

  if (!cleanEmail || !cleanPassword) {
    return {
      success: false,
      message: 'Please enter both email and password.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error) {
      console.warn('[Admin Auth] Admin authentication failed:', error.message);
      return {
        success: false,
        message: 'Invalid email or password.',
      };
    }

    if (!data || !data.session) {
      return {
        success: false,
        message: 'Invalid email or password.',
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    console.error('[Admin Auth] Unexpected auth exception:', err);
    return {
      success: false,
      message: 'Unable to sign in. Please verify your connection and try again.',
    };
  }
}

/**
 * Guard an admin page. Ensures active session exists; otherwise redirects to admin-login.html.
 * @param {function} onAuthenticated - Callback executed once session is confirmed valid.
 */
async function requireAdminSession(onAuthenticated) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session || !session.user) {
      console.warn('[Admin Auth] No active session found. Redirecting to admin-login.html');
      window.location.replace('admin-login.html');
      return;
    }

    // Subscribe to auth state changes to detect explicit sign out
    supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        window.location.replace('admin-login.html');
      }
    });

    // Invoke callback with user & session details
    if (typeof onAuthenticated === 'function') {
      onAuthenticated(session.user, session);
    }
  } catch (err) {
    console.error('[Admin Auth] Auth verification error:', err);
    window.location.replace('admin-login.html');
  }
}

/**
 * Sign out the administrator and redirect to login page.
 */
async function logoutAdmin() {
  const supabase = getAdminSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Admin Auth] Sign out warning:', err);
    }
  }
  window.location.replace('admin-login.html');
}

// Expose on window for use in admin HTML pages
window.AdminAuth = {
  getClient: getAdminSupabase,
  login: loginAdmin,
  requireSession: requireAdminSession,
  redirectIfLoggedIn: redirectIfLoggedIn,
  logout: logoutAdmin,
  SUPABASE_URL: SUPABASE_PROJECT_URL,
  SUPABASE_KEY: SUPABASE_ANON_KEY,
};
