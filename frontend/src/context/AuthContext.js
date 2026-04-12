import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { ROLES, FULL_ACCESS_MODE } from '../utils/constants';

export { ROLES };

const AuthContext = createContext(null);

const normalizePermissionName = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const extractPermissionNames = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];

  return permissions
    .map((permission) => {
      if (typeof permission === 'string') return permission;
      if (permission && typeof permission === 'object') {
        return permission.name || permission.code || permission.label || '';
      }
      return '';
    })
    .map((name) => normalizePermissionName(name))
    .filter(Boolean);
};

const collectPermissions = (rawUser = {}) => {
  const sources = [];

  if (Array.isArray(rawUser.permissions)) {
    sources.push(rawUser.permissions);
  }

  if (Array.isArray(rawUser.permissionNames)) {
    sources.push(rawUser.permissionNames);
  }

  if (rawUser.role && typeof rawUser.role === 'object' && Array.isArray(rawUser.role.permissions)) {
    sources.push(rawUser.role.permissions);
  }

  if (Array.isArray(rawUser.roles)) {
    rawUser.roles.forEach((roleItem) => {
      if (roleItem && typeof roleItem === 'object' && Array.isArray(roleItem.permissions)) {
        sources.push(roleItem.permissions);
      }
    });
  }

  return sources.flat();
};

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

const splitFullName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== 'object') return null;

  const rawPermissions = collectPermissions(rawUser);

  const normalizedRole =
    normalizeRole(rawUser.role) ||
    normalizeRole(rawUser.roleName) ||
    normalizeRole(rawUser.roles) ||
    roleFromId(rawUser.roleId);

  const fromFullName = splitFullName(rawUser.fullName || '');

  const roleId = typeof rawUser.role === 'object' ? rawUser.role?.id : rawUser.roleId;
  const departmentId = typeof rawUser.department === 'object' ? rawUser.department?.id : rawUser.departmentId;
  const departmentName = typeof rawUser.department === 'object'
    ? rawUser.department?.name || ''
    : rawUser.department || '';
  const username = rawUser.username || (rawUser.email ? String(rawUser.email).split('@')[0] : '');

  return {
    ...rawUser,
    firstName: rawUser.prenom || fromFullName.firstName || rawUser.firstName || '',
    lastName: rawUser.nom || fromFullName.lastName || rawUser.lastName || '',
    role: normalizedRole || ROLES.USER,
    username,
    department: departmentName,
    roleId: roleId || null,
    departmentId: departmentId || null,
    permissions: rawPermissions,
    permissionNames: extractPermissionNames(rawPermissions),
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
        const parsedStoredUser = JSON.parse(storedUser);
        const normalizedStoredUser = normalizeUser(parsedStoredUser);
        setUser(normalizedStoredUser);

        if (parsedStoredUser?.id) {
          try {
            const freshUser = await authAPI.getUserById(parsedStoredUser.id);
            const normalizedFreshUser = normalizeUser(freshUser);
            if (normalizedFreshUser) {
              localStorage.setItem('naftal_user', JSON.stringify(normalizedFreshUser));
              setUser(normalizedFreshUser);
            }
          } catch {
            // Keep stored user if the backend profile cannot be fetched (for example, missing read-users permission).
          }
        }
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
    const mergedRaw = { ...user, ...updatedUser };
    if (updatedUser?.fullName && !updatedUser?.firstName && !updatedUser?.lastName && !updatedUser?.prenom && !updatedUser?.nom) {
      const { firstName, lastName } = splitFullName(updatedUser.fullName);
      mergedRaw.firstName = firstName;
      mergedRaw.lastName = lastName;
    }
    const merged = normalizeUser(mergedRaw);
    localStorage.setItem('naftal_user', JSON.stringify(merged));
    setUser(merged);
  };

  const hasRole = (role) => FULL_ACCESS_MODE || user?.role === role;
  const isAdmin = () => FULL_ACCESS_MODE || user?.role === ROLES.ADMIN;
  const canEdit = () => FULL_ACCESS_MODE || user?.role === ROLES.ADMIN;
  const hasPermission = (permissionName) => {
    if (FULL_ACCESS_MODE) return true;
    const normalized = normalizePermissionName(permissionName);
    if (!normalized) return false;
    return (user?.permissionNames || []).includes(normalized);
  };
  const hasPermissionAny = (permissionNames = []) => {
    if (FULL_ACCESS_MODE) return true;
    if (!Array.isArray(permissionNames) || permissionNames.length === 0) return false;
    return permissionNames.some((permissionName) => hasPermission(permissionName));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        hasRole,
        isAdmin,
        canEdit,
        hasPermission,
        hasPermissionAny,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
