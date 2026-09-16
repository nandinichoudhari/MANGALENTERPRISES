// API Base URL
const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000'
  : (process.env.REACT_APP_BACKEND_URL || 'https://mangalenterprises.onrender.com');

export const apiUrl = (path) => `${API_BASE}${path}`;
