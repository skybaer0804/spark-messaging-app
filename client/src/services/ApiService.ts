import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const chatApi = {
  getRooms: () => api.get('/chat/rooms'),
  createRoom: (data: any) => api.post('/chat/rooms', data),
  getMessages: (roomId: string) => api.get(`/chat/messages/${roomId}`),
  sendMessage: (data: any) => api.post('/chat/messages', data),
};

export const pushApi = {
  subscribe: (subscription: any) => api.post('/push/subscribe', subscription),
  unsubscribe: () => api.post('/push/unsubscribe'),
};

export default api;

