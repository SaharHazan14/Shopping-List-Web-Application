import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const api = axios.create({
  baseURL: configuredApiUrl?.trim() || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized - redirecting to login");

      localStorage.removeItem("accessToken");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);