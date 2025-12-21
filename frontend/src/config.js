// In production (Vercel), we use relative path '' to proxy via vercel.json rewrites
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

export default API_URL;
