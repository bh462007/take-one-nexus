const API = (() => {
  const BASE_URL = window.location.origin;
  const TOKEN_KEY = 'take_one_token';
  const USER_KEY = 'take_one_user';

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
    }
  }


  return {
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
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.reload();
      }
    }
  };
})();
