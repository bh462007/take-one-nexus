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
        credentials: 'include',
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
        
        return throwError(path, options, response.status, data);
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

  function throwError(path, options, status, data) {
    const error = new Error(data.message || `Request failed with status ${status}`);
    error.status = status;
    throw error;
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
      },
      me() {
        return request('/api/users/me');
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
        if (!raw) return null;

        try {
          return JSON.parse(raw);
        } catch (error) {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('take_one_session_start');
          return null;
        }
      },
      isLoggedIn() {
        return Boolean(localStorage.getItem(TOKEN_KEY));
      },
      async validateSession() {
        const token = localStorage.getItem(TOKEN_KEY);
        const user = this.getUser();
        if (!token || !user) {
          return { valid: false, user: null };
        }

        try {
          const response = await request('/api/users/me', { method: 'GET' });
          if (!response?.success || !response?.user) {
            throw new Error(response?.message || 'Session validation failed');
          }

          const mergedUser = {
            ...user,
            ...response.user
          };
          localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
          return { valid: true, user: mergedUser };
        } catch (error) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem('take_one_session_start');
          return { valid: false, user: null };
        }
      },
      async logout() {
        try {
          await request('/api/users/logout', { method: 'POST' });
        } catch (e) {
          // Silent fail on backend logout
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
 * SESSION MANAGEMENT
 * Optimized for performance: Removed 30-minute auto-reload.
 */
(() => {
  const SESSION_MAX_AGE = 10 * 24 * 60 * 60 * 1000; // 10 days

  function checkSessionExpiry() {
    const sessionStart = localStorage.getItem('take_one_session_start');
    if (sessionStart) {
      if (Date.now() - parseInt(sessionStart, 10) > SESSION_MAX_AGE) {
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

  // Initialize
  if (typeof window !== 'undefined') {
    checkSessionExpiry();
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiry();
      }
    });
  }
})();
