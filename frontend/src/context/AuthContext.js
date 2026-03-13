import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { ROLES } from '../utils/constants';

export { ROLES };

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const normalizeRole = (roleValue) => {
  if (!roleValue) return null;
  if (typeof roleValue === 'string') return roleValue.toUpperCase();
  if (typeof roleValue === 'object') {
    const raw = roleValue.name || roleValue.code || roleValue.label || null;
    return raw ? String(raw).toUpperCase() : null;
  }
  return null;
};

const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== 'object') return null;

  const normalizedRole = normalizeRole(rawUser.role);
  const roleId = typeof rawUser.role === 'object' ? rawUser.role?.id : rawUser.roleId;
  const departmentId = typeof rawUser.department === 'object' ? rawUser.department?.id : rawUser.departmentId;

  return {
    ...rawUser,
    role: normalizedRole || rawUser.role || null,
    roleId: roleId || null,
    departmentId: departmentId || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('naftal_token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('naftal_token');
    const storedUser = localStorage.getItem('naftal_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(normalizeUser(JSON.parse(storedUser)));
      } catch {
        localStorage.removeItem('naftal_token');
        localStorage.removeItem('naftal_user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const newToken = response.accessToken;
    const newUser = normalizeUser(response.data);

    if (!newToken || !newUser) {
      throw new Error('Réponse de connexion invalide depuis le serveur.');
    }

    localStorage.setItem('naftal_token', newToken);
    localStorage.setItem('naftal_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (payload) => authAPI.register(payload);

  const logout = () => {
    localStorage.removeItem('naftal_token');
    localStorage.removeItem('naftal_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem('naftal_user', JSON.stringify(merged));
    setUser(merged);
  };

  const hasRole = (role) => user?.role === role;
  const isAdmin = () => user?.role === ROLES.ADMIN;
  const canEdit = () => user?.role === ROLES.ADMIN;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser, hasRole, isAdmin, canEdit }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
