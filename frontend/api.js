// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  console.log("[api] Kuyruktaki isteklere yeni token gönderiliyor");
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

function addSubscriber(cb) {
  subscribers.push(cb);
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
    if (config.skipAuthRefresh) {
      return Promise.reject(error);
    }

    const status = response?.status;
    if ((status === 401 || status === 403) && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        console.log(
          "[api] Access token invalid, başlatılıyor: refresh token flow"
        );
        isRefreshing = true;

        return api
          .post("/auth/refresh", null, { skipAuthRefresh: true })
          .then(({ data }) => {
            const newToken = data.accessToken;
            console.log("[api] Yeni access token alındı:", newToken);
            localStorage.setItem("accessToken", newToken);
            api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
            onRefreshed(newToken);
            isRefreshing = false;
            return api(config);
          })
          .catch((err) => {
            console.error("[api] Token yenileme başarısız:", err);
            isRefreshing = false;
            return Promise.reject(err);
          });
      }

      // Eğer zaten bir refresh akışı başlıyorsa bekle
      return new Promise((resolve) => {
        addSubscriber((token) => {
          config.headers["Authorization"] = `Bearer ${token}`;
          resolve(api(config));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
