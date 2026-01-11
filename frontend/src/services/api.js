import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        console.log('API Request:', config.method.toUpperCase(), config.url);
        
        // Add auth token if exists
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.status, error.response.data);
            
            // Handle token expiration or invalid token
            if (error.response.status === 401 || error.response.status === 403) {
                const message = error.response.data?.message || '';
                if (message.includes('token') || message.includes('expired') || message.includes('Invalid')) {
                    // Token is invalid or expired - clear auth and redirect to login
                    console.warn('Token expired or invalid. Clearing auth...');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    
                    // Only redirect if not already on login/home page
                    if (window.location.pathname !== '/' && !window.location.pathname.includes('login')) {
                        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message: 'Your session has expired. Please login again.' } }));
                        window.location.href = '/';
                    }
                }
            }
        } else if (error.request) {
            // Request was made but no response received
            console.error('Network Error: No response from server');
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// API Service Functions
export const busAPI = {
    // Get all routes
    getRoutes: async () => {
        const response = await api.get('/routes');
        return response.data;
    },

    // Get schedules for a specific route
    getSchedules: async (routeId) => {
        const response = await api.get(`/schedules/${routeId}`);
        return response.data;
    },

    // Get seat availability for a schedule
    getSeats: async (scheduleId) => {
        const response = await api.get(`/seats/${scheduleId}`);
        return response.data;
    },

    // Create a booking
    createBooking: async (bookingData) => {
        const response = await api.post('/book', bookingData);
        return response.data;
    },

    // Get all bookings (for admin)
    getAllBookings: async () => {
        const response = await api.get('/bookings');
        return response.data;
    },

    // Get booking by ID
    getBookingById: async (bookingId) => {
        const response = await api.get(`/booking/${bookingId}`);
        return response.data;
    },

    // Cancel booking
    cancelBooking: async (bookingId) => {
        const response = await api.delete(`/booking/${bookingId}`);
        return response.data;
    },

    // Health check
    healthCheck: async () => {
        const response = await api.get('/health');
        return response.data;
    },
};

// Authentication API
export const authAPI = {
    // Register new user
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    // Login user
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    // Verify token
    verify: async () => {
        const response = await api.get('/auth/verify');
        return response.data;
    },
};

// Admin API
export const adminAPI = {
    // Get dashboard stats
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // Get revenue report
    getRevenueReport: async (startDate, endDate) => {
        const response = await api.get('/admin/reports/revenue', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    // Get popular routes
    getPopularRoutes: async () => {
        const response = await api.get('/admin/reports/popular-routes');
        return response.data;
    },

    // Get occupancy report
    getOccupancyReport: async () => {
        const response = await api.get('/admin/reports/occupancy');
        return response.data;
    },

    // Get bookings report filtered by travel date range
    getBookingReport: async (startDate, endDate) => {
        const response = await api.get('/admin/reports/bookings', { params: { startDate, endDate } });
        return response.data;
    },

    // Generate PDF booking report for a date range
    generateBookingReportPDF: async (startDate, endDate, title = '') => {
        const response = await api.post('/admin/reports/bookings/pdf', { startDate, endDate, title }, { responseType: 'blob' });
        return response;
    },

    // Get all users
    getUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    // Toggle user status
    toggleUserStatus: async (userId, isActive) => {
        const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
        return response.data;
    },

    // Bulk delete users (skips admin users)
    bulkDeleteUsers: async (userIds) => {
        const response = await api.post('/admin/users/bulk-delete', { userIds });
        return response.data;
    },

    // ========== ROUTE MANAGEMENT ==========
    
    // Create new route
    createRoute: async (routeData) => {
        const response = await api.post('/admin/routes', routeData);
        return response.data;
    },

    // Update route
    updateRoute: async (routeId, routeData) => {
        const response = await api.put(`/admin/routes/${routeId}`, routeData);
        return response.data;
    },

    // Delete route
    deleteRoute: async (routeId) => {
        const response = await api.delete(`/admin/routes/${routeId}`);
        return response.data;
    },

    // ========== BUS MANAGEMENT ==========
    
    // Get all buses
    getBuses: async () => {
        const response = await api.get('/admin/buses');
        return response.data;
    },

    // Create new bus
    createBus: async (busData) => {
        const response = await api.post('/admin/buses', busData);
        return response.data;
    },

    // Update bus
    updateBus: async (busId, busData) => {
        const response = await api.put(`/admin/buses/${busId}`, busData);
        return response.data;
    },

    // Delete bus
    deleteBus: async (busId) => {
        const response = await api.delete(`/admin/buses/${busId}`);
        return response.data;
    },

    // ========== BOOKING BULK ACTIONS ==========

    bulkCancelBookings: async (bookingIds) => {
        const response = await api.post('/admin/bookings/bulk-cancel', { bookingIds });
        return response.data;
    },

    bulkDeleteBookings: async (bookingIds) => {
        const response = await api.post('/admin/bookings/bulk-delete', { bookingIds });
        return response.data;
    },

    reactivateBookings: async (bookingIds) => {
        const response = await api.post('/admin/bookings/reactivate', { bookingIds });
        return response.data;
    },

    // ========== SCHEDULE MANAGEMENT ==========
    
    // Get all schedules (with optional filters)
    getSchedules: async (filters = {}) => {
        const response = await api.get('/admin/schedules', { params: filters });
        return response.data;
    },

    // Create new schedule
    createSchedule: async (scheduleData) => {
        const response = await api.post('/admin/schedules', scheduleData);
        return response.data;
    },

    // Update schedule
    updateSchedule: async (scheduleId, scheduleData) => {
        const response = await api.put(`/admin/schedules/${scheduleId}`, scheduleData);
        return response.data;
    },

    // Delete schedule
    deleteSchedule: async (scheduleId) => {
        const response = await api.delete(`/admin/schedules/${scheduleId}`);
        return response.data;
    },

    // Update schedule status
    updateScheduleStatus: async (scheduleId, status) => {
        const response = await api.patch(`/admin/schedules/${scheduleId}/status`, { status });
        return response.data;
    },
};

export default api;
