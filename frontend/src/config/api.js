const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://data-quality-stewardship-tracker-backend.onrender.com';

export const apiUrl = (endpoint) => {
  // Remove trailing slash from base URL if present
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  // Ensure endpoint starts with a slash
  const cleanEndpoint = endpoint.startsWith('/') 
    ? endpoint 
    : '/' + endpoint;
  
  return `${baseUrl}${cleanEndpoint}`;
};

export default API_BASE_URL;