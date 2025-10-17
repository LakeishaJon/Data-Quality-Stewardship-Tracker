import axios from 'axios';

// ===============================
// API Configuration
// ===============================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://data-quality-stewardship-tracker-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===============================
// Request Interceptor - Add Auth Token
// ===============================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===============================
// Response Interceptor - Handle Auth Errors & Auto Refresh
// ===============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');
        
        if (!refresh_token) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 Token expired, refreshing...');

        // Refresh the token
        const refreshResponse = await axios.post(
          `${API_BASE_URL.replace('/api', '')}/api/auth/refresh`,
          { refresh_token },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access_token, refresh_token: new_refresh_token } = refreshResponse.data.session;

        // Update tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', new_refresh_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ===============================
// Auth APIs
// ===============================
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  signin: (data) => api.post('/auth/signin', data),
  signout: () => api.post('/auth/signout'),
  getMe: () => api.get('/auth/me'),
  refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
};

// ===============================
// Issues APIs
// ===============================
export const issuesAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  update: (id, data) => api.put(`/issues/${id}`, data),
  delete: (id) => api.delete(`/issues/${id}`),
};

// ===============================
// Dashboard APIs
// ===============================
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// ===============================
// Metadata APIs
// ===============================
export const metadataAPI = {
  getCategories: () => api.get('/categories'),
  getSeverityLevels: () => api.get('/severity-levels'),
};

// ===============================
// Export/Download APIs
// ===============================
export const exportAPI = {
  downloadCSV: async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_BASE_URL.replace('/api', '')}/api/export/csv`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the CSV content
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-quality-issues-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  },
};

// ===============================
// Fetch Wrapper (Alternative to Axios)
// ===============================
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  // Add auth header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    // If 401, try to refresh token and retry
    if (response.status === 401) {
      console.log('🔄 Token expired, refreshing...');
      
      const refresh_token = localStorage.getItem('refresh_token');
      if (!refresh_token) {
        throw new Error('No refresh token');
      }

      // Refresh token
      const refreshResponse = await fetch(
        `${API_BASE_URL.replace('/api', '')}/api/auth/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token })
        }
      );

      if (!refreshResponse.ok) {
        // Refresh failed, logout
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Token refresh failed');
      }

      const refreshData = await refreshResponse.json();
      
      // Update tokens
      localStorage.setItem('access_token', refreshData.session.access_token);
      localStorage.setItem('refresh_token', refreshData.session.refresh_token);

      // Retry original request with new token
      headers.Authorization = `Bearer ${refreshData.session.access_token}`;
      const retryResponse = await fetch(url, { ...options, headers });
      return retryResponse;
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// ===============================
// Default Export
// ===============================
export default api;