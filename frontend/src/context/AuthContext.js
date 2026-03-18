import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { ROLES, FULL_ACCESS_MODE } from '../utils/constants';
import { mockUsers } from '../mock/data';

export { ROLES };

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const normalizeRole = (roleValue) => {
  if (!roleValue) return null;

  const mapRoleAlias = (value) => {
    if (!value) return null;
    const normalized = String(value).trim().toUpperCase();
    if (['ADMIN', 'ADMINISTRATEUR', 'ADMINISTRATOR'].includes(normalized)) return ROLES.ADMIN;
    if (['USER', 'UTILISATEUR'].includes(normalized)) return ROLES.USER;
    return normalized;
  };

  if (typeof roleValue === 'string') return mapRoleAlias(roleValue);

  if (Array.isArray(roleValue)) {
    const first = roleValue[0];
    if (!first) return null;
    if (typeof first === 'string') return mapRoleAlias(first);
    const raw = first.name || first.code || first.label || first.roleName || null;
    return mapRoleAlias(raw);
  }

  if (typeof roleValue === 'object') {
    const raw = roleValue.name || roleValue.code || roleValue.label || roleValue.roleName || null;
    return mapRoleAlias(raw);
  }
  return null;
};

const roleFromId = (roleId) => {
  const asNumber = Number(roleId);
  if (asNumber === 1) return ROLES.ADMIN;
  if (asNumber === 2) return ROLES.USER;
  return null;
};

const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== 'object') return null;

  const normalizedRole =
    normalizeRole(rawUser.role) ||
    normalizeRole(rawUser.roleName) ||
    normalizeRole(rawUser.roles) ||
    roleFromId(rawUser.roleId);

  const matchedMockUser = rawUser.email
    ? mockUsers.find((mockUser) => mockUser.email?.toLowerCase() === rawUser.email.toLowerCase())
    : null;

  const roleId = typeof rawUser.role === 'object' ? rawUser.role?.id : rawUser.roleId;
  const departmentId = typeof rawUser.department === 'object' ? rawUser.department?.id : rawUser.departmentId;

  return {
    ...rawUser,
    firstName: rawUser.firstName || rawUser.prenom || matchedMockUser?.firstName || '',
    lastName: rawUser.lastName || rawUser.nom || matchedMockUser?.lastName || '',
    role: normalizedRole || matchedMockUser?.role || ROLES.USER,
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
    const merged = normalizeUser({ ...user, ...updatedUser });
    localStorage.setItem('naftal_user', JSON.stringify(merged));
    setUser(merged);
  };

  const hasRole = (role) => FULL_ACCESS_MODE || user?.role === role;
  const isAdmin = () => FULL_ACCESS_MODE || user?.role === ROLES.ADMIN;
  const canEdit = () => FULL_ACCESS_MODE || user?.role === ROLES.ADMIN;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser, hasRole, isAdmin, canEdit }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
