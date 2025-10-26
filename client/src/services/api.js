import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Students API
export const studentsAPI = {
    getAll: () => api.get('/students'),
    getOne: (id) => api.get(`/students/${id}`),
    create: (data) => api.post('/students', data),
    update: (id, data) => api.patch(`/students/${id}`, data),
    delete: (id) => api.delete(`/students/${id}`),
};

// Payments API
export const paymentsAPI = {
    getAll: () => api.get('/payments'),
    getByStudent: (studentId) => api.get(`/payments/student/${studentId}`),
    create: (data) => api.post('/payments', data),
    delete: (id) => api.delete(`/payments/${id}`),
    getTotalByStudent: (studentId) => api.get(`/payments/total/${studentId}`),
};

// Expenses API
export const expensesAPI = {
    getAll: () => api.get('/expenses'),
    create: (data) => api.post('/expenses', data),
    delete: (id) => api.delete(`/expenses/${id}`),
};

// Settings API
export const settingsAPI = {
    get: (key) => api.get(`/settings/${key}`),
    set: (key, value) => api.post('/settings', { key, value }),
    getAll: () => api.get('/settings'),
};

// ===== TAMBAHKAN INI: Events API =====
export const eventsAPI = {
    getAll: () => api.get('/events'),
    getOne: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.patch(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
    complete: (id) => api.post(`/events/${id}/complete`),
};

// ===== TAMBAHKAN INI: Event Payments API =====
export const eventPaymentsAPI = {
    getByEvent: (eventId) => api.get(`/events/${eventId}/payments`),
    create: (eventId, data) => api.post(`/events/${eventId}/payments`, data),
    delete: (eventId, paymentId) =>
        api.delete(`/events/${eventId}/payments/${paymentId}`),
};

// ===== TAMBAHKAN INI: Notifications API =====
export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    getByStudent: (studentId) => api.get(`/notifications/student/${studentId}`),
    getNeedsReminder: (minWeeks) =>
        api.get(`/notifications/needs-reminder?minWeeks=${minWeeks}`),
    sendReminder: (studentId, data) =>
        api.post(`/notifications/send-reminder/${studentId}`, data),
    sendBulkReminder: (data) =>
        api.post('/notifications/send-bulk-reminder', data),
    sendThankYou: (studentId) =>
        api.post(`/notifications/send-thank-you/${studentId}`),
    sendCustom: (data) => api.post('/notifications/send-custom', data),
    sendToGroup: (data) => api.post('/notifications/send-to-group', data),
    preview: (data) => api.post('/notifications/preview', data),
    previewGroup: (data) => api.post('/notifications/preview-group', data),
    // Event reminder endpoints
    sendEventReminder: (studentId, eventId, data) =>
        api.post(
            `/notifications/send-event-reminder/${studentId}/${eventId}`,
            data
        ),
    sendEventReminderBulk: (eventId, data) =>
        api.post(`/notifications/send-event-reminder-bulk/${eventId}`, data),
    sendEventReminderGroup: (eventId, data) =>
        api.post(`/notifications/send-event-reminder-group/${eventId}`, data),
    previewEventReminder: (eventId, data) =>
        api.post(`/notifications/preview-event-reminder/${eventId}`, data),
    getStatus: () => api.get('/notifications/status'),
    getStats: () => api.get('/notifications/stats'),
};

export default api;
