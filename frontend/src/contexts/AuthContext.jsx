import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to refresh the access token
  const refreshToken = useCallback(async () => {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://data-quality-stewardship-tracker-backend.onrender.com/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update tokens
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token);
      
      return data.session.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      logout();
      return null;
    }
  }, []);

  // Check and refresh token on mount and periodically
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);

    // Set up token refresh every 50 minutes (tokens expire in 1 hour)
    const refreshInterval = setInterval(() => {
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('🔄 Refreshing token...');
        refreshToken();
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [refreshToken]);

  const login = (userData, token, refresh_token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};