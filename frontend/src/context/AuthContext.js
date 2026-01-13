import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending2FA, setPending2FA] = useState(null); // Stores email/password when 2FA is needed

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, totpCode = null) => {
    const payload = { email, password };
    if (totpCode) {
      payload.totp_code = totpCode;
    }
    
    const response = await axios.post(`${API}/auth/login`, payload);
    const { access_token, user: userData, requires_2fa } = response.data;
    
    // If 2FA is required, store credentials and return indicator
    if (requires_2fa) {
      setPending2FA({ email, password });
      return { requires_2fa: true };
    }
    
    // Clear any pending 2FA state
    setPending2FA(null);
    
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    return { user: userData };
  };

  const verify2FA = async (totpCode) => {
    if (!pending2FA) {
      throw new Error('No pending 2FA verification');
    }
    
    const { email, password } = pending2FA;
    return login(email, password, totpCode);
  };

  const cancel2FA = () => {
    setPending2FA(null);
  };

  const register = async (name, email, password, referralCode = null) => {
    const payload = { name, email, password };
    if (referralCode) {
      payload.referral_code = referralCode;
    }
    
    const response = await axios.post(`${API}/auth/register`, payload);
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setPending2FA(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      pending2FA, 
      verify2FA, 
      cancel2FA 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
