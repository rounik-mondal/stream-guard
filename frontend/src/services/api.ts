import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    guest: '/api/auth/guest',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },
  
  // Users
  users: {
    me: '/api/users/me',
    update: '/api/users/me',
    search: '/api/users/search',
    profile: (id: number) => `/api/users/${id}`,
    username: (username: string) => `/api/users/username/${username}`,
    follow: (id: number) => `/api/users/${id}/follow`,
    unfollow: (id: number) => `/api/users/${id}/follow`,
    followers: (id: number) => `/api/users/${id}/followers`,
    following: (id: number) => `/api/users/${id}/following`,
    block: (id: number) => `/api/users/${id}/block`,
    unblock: (id: number) => `/api/users/${id}/block`,
  },
  
  // Streams
  streams: {
    list: '/api/streams',
    live: '/api/streams/live',
    create: '/api/streams',
    get: (id: number) => `/api/streams/${id}`,
    update: (id: number) => `/api/streams/${id}`,
    delete: (id: number) => `/api/streams/${id}`,
    start: (id: number) => `/api/streams/${id}/start`,
    end: (id: number) => `/api/streams/${id}/end`,
    view: (id: number) => `/api/streams/${id}/view`,
    leave: (id: number) => `/api/streams/${id}/view`,
  },
  
  // Chat
  chat: {
    analyze: '/api/chat/analyze',
    send: '/api/chat/send',
    messages: (streamId: number) => `/api/chat/${streamId}/messages`,
    delete: (messageId: number) => `/api/chat/${messageId}`,
    report: (messageId: number) => `/api/chat/${messageId}/report`,
    stats: '/api/chat/stats/filter',
    ws: (streamId: number) => `/api/chat/${streamId}/ws`,
  },
};

// Helper functions
export const apiHelpers = {
  // Handle API errors
  handleError: (error: any) => {
    if (error.response) {
      return error.response.data.detail || 'An error occurred';
    } else if (error.request) {
      return 'Network error. Please check your connection.';
    } else {
      return error.message || 'An unexpected error occurred';
    }
  },
  
  // Create query params
  createQueryParams: (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return searchParams.toString();
  },
  
  // Format date
  formatDate: (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
  
  // Format duration
  formatDuration: (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },
  
  // Format viewer count
  formatViewerCount: (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  },
};
