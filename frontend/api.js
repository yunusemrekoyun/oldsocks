// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;

function clearExpiredSession() {
  localStorage.removeItem("accessToken");
  delete api.defaults.headers.common.Authorization;
  window.dispatchEvent(new Event("auth:session-expired"));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response } = error;

    // Bu bayrak varsa refresh interceptor’ü atla
    if (config?.skipAuthRefresh) {
      return Promise.reject(error);
    }

    const status = response?.status;
    if ((status === 401 || status === 403) && config && !config._retry) {
      config._retry = true;

      if (!refreshPromise) {
        refreshPromise = api
          .post("/auth/refresh", null, { skipAuthRefresh: true })
          .then(({ data }) => {
            const newToken = data.accessToken;
            localStorage.setItem("accessToken", newToken);
            api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
            return newToken;
          })
          .catch((err) => {
            clearExpiredSession();
            throw err;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      return refreshPromise.then((token) => {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
        return api(config);
      });
    }

    return Promise.reject(error);
  }
);

export default api;
