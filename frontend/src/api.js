import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor - attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token expiry silently
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");
        if (!refreshToken) {
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Get new access token
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const newToken = res.data.access_token;
        const newRefresh = res.data.refresh_token;

        localStorage.setItem("token", newToken);
        localStorage.setItem("refresh_token", newRefresh);

        // Retry original request with new token
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);

      } catch {
        // Refresh token also expired — logout cleanly
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;