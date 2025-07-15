// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // cookie’lerin frontend’den gönderilmesi için
});

// access token’ı header’a eklemek için interceptor
let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

function addSubscriber(cb) {
  subscribers.push(cb);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const { config, response } = err;
    if (config.skipAuthRefresh) {
      return Promise.reject(err);
    }
    if (response?.status === 401 && !config._retry) {
      config._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        return api
          .post("/auth/refresh")
          .then(({ data }) => {
            const newToken = data.accessToken;
            localStorage.setItem("accessToken", newToken);
            api.defaults.headers["Authorization"] = `Bearer ${newToken}`;
            onRefreshed(newToken);
            isRefreshing = false;
            return api(config);
          })
          .catch((e) => {
            isRefreshing = false;
            throw e;
          });
      }
      return new Promise((resolve) => {
        addSubscriber((token) => {
          config.headers["Authorization"] = `Bearer ${token}`;
          resolve(api(config));
        });
      });
    }
    return Promise.reject(err);
  }
);

export default api;
