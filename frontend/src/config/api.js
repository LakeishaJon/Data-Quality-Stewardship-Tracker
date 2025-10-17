const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://data-quality-stewardship-tracker-backend.onrender.com/api';

export const apiUrl = (endpoint) => {
  
  const baseUrl = API_BASE_URL.endsWith('/api') 
    ? API_BASE_URL.slice(0, -4) 
    : API_BASE_URL;
  
  return `${baseUrl}${endpoint}`;
};

export default API_BASE_URL;