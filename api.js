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

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
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
