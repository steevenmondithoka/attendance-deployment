import axios from 'axios';

// The fallback URL is correct
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://attendance-deployment.onrender.com';

const api = axios.create({
    // ------------------------------------------------------------------
    // ✅ FIX: Append /api to the base URL
    // This will make the final request to: [Your Render URL]/api/class
    baseURL: `${BACKEND_URL}/api`, 
    // ------------------------------------------------------------------
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;