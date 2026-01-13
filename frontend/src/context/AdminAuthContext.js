import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending2FA, setPending2FA] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      fetchAdminProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdminProfile = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmin(response.data);
    } catch (error) {
      localStorage.removeItem('admin_token');
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
    const { access_token, admin: adminData, requires_2fa } = response.data;
    
    // If 2FA is required, store credentials and return indicator
    if (requires_2fa) {
      setPending2FA({ email, password });
      return { requires_2fa: true };
    }
    
    // Clear any pending 2FA state
    setPending2FA(null);
    
    localStorage.setItem('admin_token', access_token);
    setAdmin(adminData);
    return { admin: adminData };
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

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    setPending2FA(null);
  };

  const hasPermission = (permission) => {
    if (!admin) return false;
    const permissions = admin.permissions || [];
    if (permissions.includes('*')) return true;
    
    for (const perm of permissions) {
      if (perm === permission) return true;
      if (perm.endsWith(':*')) {
        const prefix = perm.slice(0, -2);
        if (permission.startsWith(prefix + ':')) return true;
      }
    }
    return false;
  };

  return (
    <AdminAuthContext.Provider value={{ 
      admin, 
      login, 
      logout, 
      loading, 
      hasPermission,
      pending2FA,
      verify2FA,
      cancel2FA
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
