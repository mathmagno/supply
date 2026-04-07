import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// AUTH_DISABLED: injeta token fictício para o backend não rejeitar
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") ?? "dev-token";
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
