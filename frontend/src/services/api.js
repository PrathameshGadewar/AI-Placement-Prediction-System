import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Interceptor to inject JWT Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
};

export const predictService = {
  predictManual: (studentData) => api.post('/predict/manual', studentData),
  predictResume: (formData) => api.post('/predict/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getHistory: () => api.get('/predict/history'),
  downloadPDF: (historyId) => `/api/predict/download-pdf/${historyId}`,
};

export const matchingService = {
  parseJD: (formData) => api.post('/matching/parse-jd', formData),
  matchResumeJD: (formData) => api.post('/matching/match', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const recruiterService = {
  batchRank: (formData) => api.post('/recruiter/batch-rank', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  exportExcel: (candidatesJson) => {
    const body = new FormData();
    body.append('candidates_json', candidatesJson);
    return api.post('/recruiter/export-excel', body, { responseType: 'blob' });
  }
};

export const adminService = {
  getMetrics: () => api.get('/admin/metrics'),
};

export default api;
