import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://attendance-deployment.onrender.com';

const api = axios.create({
    // KEEP: baseURL is just the root of your server: https://attendance-deployment.onrender.com
    baseURL: BACKEND_URL, 
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
