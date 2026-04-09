import axios from 'axios';

const configuredApiUrl = (process.env.REACT_APP_API_URL || '').trim();
const isDevelopment = process.env.NODE_ENV === 'development';
const BASE_URL = isDevelopment ? '' : configuredApiUrl;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

let isRefreshing = false;
let refreshSubscribers = [];

const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some((endpoint) => String(url).includes(endpoint));

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const clearSession = () => {
  localStorage.removeItem('naftal_token');
  localStorage.removeItem('naftal_user');
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('naftal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const hasStoredToken = Boolean(localStorage.getItem('naftal_token'));

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (!hasStoredToken) {
      return Promise.reject(error);
    }

    if (isAuthEndpoint(originalRequest.url) || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axiosInstance.post('/auth/refresh');
      const newAccessToken = refreshResponse?.data?.accessToken;

      if (!newAccessToken) {
        throw new Error('Access token manquant après refresh');
      }

      localStorage.setItem('naftal_token', newAccessToken);
      onRefreshed(newAccessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      onRefreshed(null);
      clearSession();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
