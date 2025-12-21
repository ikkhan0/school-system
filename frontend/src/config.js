// In production (Vercel), we explicitly point to our domain to avoid any env var confusion
const API_URL = import.meta.env.PROD ? 'https://soft-school-management.vercel.app' : 'http://localhost:5000';

export default API_URL;
