// In production (Vercel), we use relative path '' to proxy via vercel.json rewrites.
// This avoids CORS issues and ensures we use the correct domain automatically.
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

// Configure axios to include session ID in all requests
import axios from 'axios';

axios.interceptors.request.use((config) => {
    const sessionId = localStorage.getItem('selectedSessionId');
    if (sessionId) {
        config.headers['x-session-id'] = sessionId;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API_URL;
