// ─── Mock data layer (replace each function body with an axiosInstance call when connecting to backend) ───
// Example swap for login:
//   return axiosInstance.post('/auth/login', { username, password }).then((r) => r.data);
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────

import { mockUsers } from '../mock/data';
import { ROLES } from '../utils/constants';
// import axiosInstance from './axios'; // ← uncomment when switching to real API

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

let usersDB = [...mockUsers];
let nextId = usersDB.length + 1;

export { ROLES };

export const authAPI = {
  /** POST /auth/login → { token, user } */
  login: async (email, password) => {
    await delay(600);
    const user = usersDB.find((u) => u.email === email && u.password === password && u.active);
    if (!user) throw new Error('Identifiants incorrects');
    if (!user.active) throw new Error('Ce compte est désactivé. Contactez un administrateur.');
    const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86400000 }));
    const { password: _p, ...safeUser } = user;
    return { token, user: safeUser };
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

