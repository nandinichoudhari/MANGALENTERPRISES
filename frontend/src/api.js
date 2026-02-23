// API Base URL — uses environment variable in production, proxy in development
const API_BASE = process.env.REACT_APP_API_URL || '';

export const apiUrl = (path) => `${API_BASE}${path}`;
