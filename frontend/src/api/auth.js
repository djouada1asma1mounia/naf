import { mockUsers } from '../mock/data';
import { ROLES } from '../utils/constants';

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

let usersDB = [...mockUsers];
let nextId = usersDB.length + 1;

export const authAPI = {
  login: async (username, password) => {
    await delay(600);
    const user = usersDB.find((u) => u.username === username && u.password === password && u.active);
    if (!user) throw new Error('Identifiants incorrects');
    const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86400000 }));
    const { password: _p, ...safeUser } = user;
    return { token, user: safeUser };
  },

  getUsers: async () => {
    await delay(400);
    return usersDB.map(({ password: _p, ...u }) => u);
  },

  getUserById: async (id) => {
    await delay(300);
    const user = usersDB.find((u) => u.id === Number(id));
    if (!user) throw new Error('Utilisateur non trouvé');
    const { password: _p, ...safe } = user;
    return safe;
  },

  createUser: async (data) => {
    await delay(500);
    const exists = usersDB.find((u) => u.username === data.username);
    if (exists) throw new Error("Nom d'utilisateur déjà utilisé");
    const newUser = { ...data, id: nextId++, createdAt: new Date().toISOString().split('T')[0], active: true };
    usersDB.push(newUser);
    const { password: _p, ...safe } = newUser;
    return safe;
  },

  updateUser: async (id, data) => {
    await delay(400);
    const idx = usersDB.findIndex((u) => u.id === Number(id));
    if (idx === -1) throw new Error('Utilisateur non trouvé');
    usersDB[idx] = { ...usersDB[idx], ...data };
    const { password: _p, ...safe } = usersDB[idx];
    return safe;
  },

  deleteUser: async (id) => {
    await delay(400);
    usersDB = usersDB.filter((u) => u.id !== Number(id));
    return { success: true };
  },

  changePassword: async (id, oldPassword, newPassword) => {
    await delay(400);
    const user = usersDB.find((u) => u.id === Number(id));
    if (!user) throw new Error('Utilisateur non trouvé');
    if (user.password !== oldPassword) throw new Error('Ancien mot de passe incorrect');
    user.password = newPassword;
    return { success: true };
  },

  getRoles: () => Object.values(ROLES),
};
