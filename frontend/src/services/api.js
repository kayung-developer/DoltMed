import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, error => Promise.reject(error));

api.interceptors.response.use(response => response, async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            try {
                const res = await axios.post(`${API_URL}/auth/token/refresh`, new URLSearchParams({ 'refresh_token': refreshToken }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
                const { access_token, refresh_token: new_refresh_token } = res.data;
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', new_refresh_token);
                api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.clear();
                toast.error("Session expired. Please login again.");
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
    }
    return Promise.reject(error);
});

export const authService = {
    login: (credentials) => api.post('/auth/login', new URLSearchParams(credentials)),
    registerPatient: (data) => api.post('/auth/register/patient', data),
    registerPhysician: (data) => api.post('/auth/register/physician', data),
    getCurrentUser: () => api.get('/auth/me'),
};
export const patientService = {
    getProfile: () => api.get('/patient/profile'),
    updateProfile: (data) => api.put('/patient/profile/update', data),
    uploadDocument: (formData) => api.post('/patient/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getDocuments: () => api.get('/patient/documents'),
    processOcr: (formData) => api.post('/patient/documents/upload/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getDashboardSummary: () => api.get('/patient/dashboard-summary'),
    submitFeedback: (appointmentId, data) => api.post(`/patient/appointments/${appointmentId}/feedback`, data),
    getVitals: (vitalType) => api.get(`/patient/vitals/${vitalType}`),
    recordVital: (data) => api.post('/patient/vitals', data),
};
export const physicianService = {
    getProfile: () => api.get('/physician/profile'),
    updateProfile: (data) => api.put('/physician/profile/update', data),
    getAppointments: (status) => api.get('/physician/appointments', { params: { status } }),
    getMyPatients: () => api.get('/physician/my-patients'),
    getPatientFullProfile: (patientId) => api.get(`/physician/patients/${patientId}/full-profile`),
    createPrescription: (data) => api.post('/physician/prescriptions/create', data),
    getDevelopmentResources: () => api.get('/physician/development/resources'),
};
export const appointmentService = {
    searchPhysicians: (specialty) => api.get('/appointments/physicians/search', { params: { specialty } }),
    bookAppointment: (data) => api.post('/appointments/book', data),
    getUserAppointments: () => api.get('/patient/appointments'), // New endpoint needed on backend
    reschedule: (appointmentId, newTime) => api.patch(`/appointments/${appointmentId}/reschedule`, { new_appointment_time: newTime }),
    cancel: (appointmentId) => api.delete(`/appointments/${appointmentId}/cancel`),
    searchPhysiciansGeo: (params) => api.get('/appointments/physicians/search/geo', { params }),
};
export const adminService = {
  listUsers: (params) => api.get('/admin/users', { params }),
  getPendingPhysicians: () => api.get('/admin/physicians/pending-verification'),
  verifyPhysician: (physicianId, data) => api.post(`/admin/physicians/${physicianId}/verify`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getDashboardKpis: () => api.get('/admin/dashboard-kpis'),
  getUserGrowthData: () => api.get('/admin/analytics/user-growth'),
  getRecentPayments: () => api.get('/admin/payments/recent'),
};
export const telemedicineService = {
  getAccessToken: (appointmentId) => api.get(`/telemedicine/token/${appointmentId}`),
};
export const paymentService = {
  getPlans: () => api.get('/payments/plans'),
  initializePaystackPayment: (data) => api.post('/payments/initialize/paystack', data),
};
export const aiService = {
  getDiagnosisSuggestion: (data) => api.post('/ai/diagnosis-support', data),
  // We can add other AI service calls here later
  getCardiovascularRisk: (data) => api.post('/ai/risk-prediction/cardiovascular', data),
  checkDrugInteractions: (data) => api.post('/ai/drug-interaction', data),
  getMedicalTips: () => api.get('/ai/medical-tips'),
  getMealPlan: (condition) => api.get('/ai/recommendations/meal-plan', { params: { condition } }),
   getWellnessPlan: () => api.get('/ai/recommendations/wellness-plan'),
};
export const settingsService = {
  changePassword: (data) => api.put('/settings/password', data),
  setup2FA: () => api.post('/settings/2fa/setup'),
  enable2FA: (data) => api.post('/settings/2fa/enable', data),
  disable2FA: (data) => api.post('/settings/2fa/disable', data),
};

export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`),
};
export const hospitalService = {
  search: (query) => api.get('/hospitals/search', { params: { query } }),
};
// Add admin-specific hospital services if building an admin UI for it
export const adminHospitalService = {
    create: (data) => api.post('/admin/hospitals', data),
    list: (params) => api.get('/admin/hospitals', { params }),
    update: (id, data) => api.put(`/admin/hospitals/${id}`, data),
    delete: (id) => api.delete(`/admin/hospitals/${id}`),
};

export const adminCmsService = {
    listPosts: () => api.get('/admin/cms/posts'),
    createPost: (data) => api.post('/admin/cms/posts', data),
    updatePost: (id, data) => api.put(`/admin/cms/posts/${id}`, data),
    deletePost: (id) => api.delete(`/admin/cms/posts/${id}`),
};
export const blogService = {
    getPublicPosts: () => api.get('/blog/posts'),
};
export const systemService = {
    getHealth: () => api.get('/health'),
};

export default api;