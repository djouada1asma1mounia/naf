let accessToken = null;

export const tokenManager = {
  getToken() {
    return accessToken;
  },
  setToken(token) {
    accessToken = token;
  },
  clearToken() {
    accessToken = null;
  },
};
