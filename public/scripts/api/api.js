const API = (() => {
  const BASE_URL = window.location.origin;
  const TOKEN_KEY = 'take_one_token';
  const USER_KEY = 'take_one_user';
  let activeRequests = 0;

  function getActiveRequests() {
    return activeRequests;
  }

  async function request(path, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Timeout mechanism
    const timeout = options.timeout || 15000; // Default 15s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    activeRequests++;

    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(() => ({}));
      } else {
        data = { message: await response.text().catch(() => 'Request failed') };
      }

      if (!response.ok) {
        // Handle unauthorized
        if (response.status === 401 && token) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          window.location.reload();
        }
        
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('The request timed out. Please check your internet connection or try again later.');
      }
      throw err;
    } finally {
      activeRequests--;
    }
  }


  return {
    getActiveRequests,
    home: {
      get() {
        return request('/api/home');
      }
    },
    scripts: {
      search(query, genre = '') {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (genre) params.set('genre', genre);
        return request(`/api/scripts/search?${params.toString()}`);
      },
      create(payload) {
        return request('/api/scripts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
    },
    requests: {
      create(payload) {
        return request('/api/requests', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },
      forUser(id) {
        return request(`/api/requests/user/${id}`);
      },
      updateStatus(id, status) {
        return request(`/api/requests/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
      }
    },
    notifications: {
      forUser(id) {
        return request(`/api/notifications/user/${id}`);
      },
      markRead(id) {
        return request(`/api/notifications/${id}/read`, {
          method: 'PATCH'
        });
      },
      markAllRead(id) {
        return request(`/api/notifications/user/${id}/read-all`, {
          method: 'PATCH'
        });
      }
    },
    system: {
      emailStatus() {
        return request('/api/system/email/status');
      },
      sendEmailTest() {
        return request('/api/system/email/test', {
          method: 'POST',
          body: JSON.stringify({})
        });
      }
    },
    moderation: {
      report(payload) {
        return request('/api/moderation/reports', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },
      listReports(status = '') {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        return request(`/api/moderation/reports?${params.toString()}`);
      },
      updateReport(id, payload) {
        return request(`/api/moderation/reports/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      }
    },
    users: {
      register(payload) {
        return request('/api/users/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },
      login(email, password) {
        return request('/api/users/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
      },
      search(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value) query.set(key, value);
        });
        return request(`/api/users/search?${query.toString()}`);
      },
      getProfile(id) {
        return request(`/api/users/${id}`);
      },
      updateProfile(id, payload) {
        return request(`/api/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }
    },
    auth: {
      saveToken(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem('take_one_session_start', Date.now());
      },
      getToken() {
        return localStorage.getItem(TOKEN_KEY);
      },
      getUser() {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      },
      isLoggedIn() {
        return Boolean(localStorage.getItem(TOKEN_KEY));
      },
      async logout() {
        try {
          await request('/api/users/logout', { method: 'POST' });
        } catch (e) {
          console.warn('Backend logout failed:', e);
        }
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('take_one_session_start');
        window.location.reload();
      }
    }
  };
})();

/**
 * SESSION & RELOAD MANAGEMENT
 * Implements: 
 * 1. 30-minute auto-reload (Safe, Visibility-aware)
 * 2. 10-day auto sign-out
 */
(() => {
  const RELOAD_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const SESSION_MAX_AGE = 10 * 24 * 60 * 60 * 1000; // 10 days
  let reloadTimer = null;

  function checkSessionExpiry() {
    const sessionStart = localStorage.getItem('take_one_session_start');
    if (sessionStart) {
      if (Date.now() - parseInt(sessionStart, 10) > SESSION_MAX_AGE) {
        console.log('Session expired (10 days). Logging out...');
        if (typeof API !== 'undefined' && API.auth) {
          API.auth.logout();
        } else {
          localStorage.clear();
          window.location.reload();
        }
        return true;
      }
    }
    return false;
  }

  function setupAutoReload() {
    if (reloadTimer) clearTimeout(reloadTimer);

    reloadTimer = setTimeout(() => {
      // 1. Check session expiry first
      if (checkSessionExpiry()) return;

      // 2. Safe reload logic
      if (document.visibilityState === 'visible') {
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.contentEditable === 'true'
        );
        
        // Check for active uploads or forms (heuristics)
        const isUploading = !!document.querySelector('.is-uploading, [data-uploading="true"]');
        const isSubmitting = !!document.querySelector('.is-submitting, [data-submitting="true"]');
        
        if (!isTyping && !isUploading && !isSubmitting && API.getActiveRequests() === 0) {
          console.log('Performing scheduled 30-minute reload...');
          window.location.reload();
        } else {
          // Retry in 5 minutes if user is busy
          console.log('User busy, delaying reload by 5 minutes...');
          reloadTimer = setTimeout(setupAutoReload, 5 * 60 * 1000);
        }
      } else {
        // Tab hidden, wait for it to become visible
        console.log('Tab hidden, waiting for visibility to reload...');
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            setupAutoReload();
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    }, RELOAD_INTERVAL);
  }

  // Initialize
  if (typeof window !== 'undefined') {
    // Check expiry immediately on load
    checkSessionExpiry();
    
    // Set up the periodic reload
    setupAutoReload();
    
    // Also check expiry when tab becomes visible after being away
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiry();
      }
    });
  }
})();
