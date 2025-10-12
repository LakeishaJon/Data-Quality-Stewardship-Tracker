const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fictional-space-capybara-69p4xrv676jxh5659-5000.app.github.dev/api';

export const apiUrl = (endpoint) => {
  // Remove /api if it's already in the base URL
  const baseUrl = API_BASE_URL.endsWith('/api') 
    ? API_BASE_URL.slice(0, -4) 
    : API_BASE_URL;
  
  return `${baseUrl}${endpoint}`;
};

export default API_BASE_URL;