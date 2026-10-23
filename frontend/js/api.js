/**
 * Tamil Nadu Energy Management API Client
 */
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : '/api';

const API = {
  getToken() {
    return localStorage.getItem('tn_token');
  },

  setToken(token) {
    localStorage.setItem('tn_token', token);
  },

  getUser() {
    const raw = localStorage.getItem('tn_user');
    return raw ? JSON.parse(raw) : null;
  },

  setUser(user) {
    localStorage.setItem('tn_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('tn_token');
    localStorage.removeItem('tn_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          this.clearSession();
          window.location.href = '/login.html?expired=true';
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // Auth endpoints
  async register(payload) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      this.setToken(res.token);
      this.setUser(res.user);
    }
    return res;
  },

  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      this.setToken(res.token);
      this.setUser(res.user);
    }
    return res;
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // Location endpoints
  async getDistricts() {
    return this.request('/locations/districts');
  },

  async getMyLocations() {
    return this.request('/locations');
  },

  async createLocation(payload) {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Readings endpoints
  async getReadings(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/energy/readings${q ? '?' + q : ''}`);
  },

  async addReading(payload) {
    return this.request('/energy/readings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async batchIngest(readings, readingSource) {
    return this.request('/energy/readings/batch', {
      method: 'POST',
      body: JSON.stringify({ readings, readingSource })
    });
  },

  async deleteReading(id) {
    return this.request(`/energy/readings/${id}`, {
      method: 'DELETE'
    });
  },

  // Billing endpoints
  async calculateEstimate(payload) {
    return this.request('/billing/estimate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getBillingHistory() {
    return this.request('/billing/history');
  },

  // Prediction endpoints
  async generatePrediction(forecastPeriod = 'next_billing_period') {
    return this.request('/predictions/generate', {
      method: 'POST',
      body: JSON.stringify({ forecastPeriod })
    });
  },

  async getPredictions() {
    return this.request('/predictions');
  },

  async getLatestPrediction() {
    return this.request('/predictions/latest');
  },

  // Devices endpoints
  async getDevices() {
    return this.request('/devices');
  },

  async registerDevice(payload) {
    return this.request('/devices', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async simulateDeviceTelemetry(deviceId) {
    return this.request(`/devices/${deviceId}/telemetry`, {
      method: 'POST'
    });
  },

  // Admin endpoints
  async getAuditLogs(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/admin/audit-logs${q ? '?' + q : ''}`);
  },

  async getTariffVersions() {
    return this.request('/admin/tariffs');
  },

  async getAdminStats() {
    return this.request('/admin/stats');
  }
};
