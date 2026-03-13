// ─── Mock data layer (replace each function body with an axiosInstance call when connecting to backend) ───
// Example swap for login:
//   return axiosInstance.post('/auth/login', { username, password }).then((r) => r.data);
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────

import { mockUsers } from '../mock/data';
import { ROLES } from '../utils/constants';
import axiosInstance from './axios';

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

let usersDB = [...mockUsers];
let nextId = usersDB.length + 1;

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

export { ROLES };

export const authAPI = {
  /** POST /auth/login → { accessToken, data, message } */
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const payload = response.data || {};
      return {
        accessToken: payload.accessToken,
        data: payload.data,
        message: payload.message,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Identifiants incorrects.'));
    }
  },

  /** POST /auth/register */
  register: async (payload) => {
    try {
      const response = await axiosInstance.post('/auth/register', payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de l’inscription.'));
    }
  },

  /** GET /users */
  getUsers: async () => {
    await delay(400);
    return usersDB.map(({ password: _p, ...u }) => u);
  },

  /** GET /users/:id */
  getUserById: async (id) => {
    await delay(300);
    const user = usersDB.find((u) => u.id === Number(id));
    if (!user) throw new Error('Utilisateur non trouvé');
    const { password: _p, ...safe } = user;
    return safe;
  },

  /** POST /users */
  createUser: async (data) => {
    await delay(500);
    const exists = usersDB.find((u) => u.email === data.email);
    if (exists) throw new Error('Email déjà utilisé');
    const newUser = { ...data, id: nextId++, createdAt: new Date().toISOString().split('T')[0], active: true };
    usersDB.push(newUser);
    const { password: _p, ...safe } = newUser;
    return safe;
  },

  /** PATCH /users/:id */
  updateUser: async (id, data) => {
    await delay(400);
    const idx = usersDB.findIndex((u) => u.id === Number(id));
    if (idx === -1) throw new Error('Utilisateur non trouvé');
    usersDB[idx] = { ...usersDB[idx], ...data };
    const { password: _p, ...safe } = usersDB[idx];
    return safe;
  },

  /** DELETE /users/:id */
  deleteUser: async (id) => {
    await delay(400);
    usersDB = usersDB.filter((u) => u.id !== Number(id));
    return { success: true };
  },

  /** PATCH /users/:id/password */
  changePassword: async (id, oldPassword, newPassword) => {
    await delay(400);
    const user = usersDB.find((u) => u.id === Number(id));
    if (!user) throw new Error('Utilisateur non trouvé');
    if (user.password !== oldPassword) throw new Error('Ancien mot de passe incorrect');
    user.password = newPassword;
    return { success: true };
  },
};

