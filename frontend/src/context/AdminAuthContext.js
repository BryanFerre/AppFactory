import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, admin: adminData } = response.data;
    localStorage.setItem('admin_token', access_token);
    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
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
    <AdminAuthContext.Provider value={{ admin, login, logout, loading, hasPermission }}>
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
