import axios from 'axios';
import { API_BASE_URL as CONFIG_BASE_URL } from '../config';

const API_BASE_URL = CONFIG_BASE_URL || process.env.REACT_APP_API_URL || 'https://notes-backend-wheat.vercel.app';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor to handle errors globally
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.client.post('/auth/login', { email, password });
  }

  async getCurrentUser() {
    return this.client.get('/auth/me');
  }

  // Notes endpoints
  async getNotes(params = {}) {
    return this.client.get('/notes', { params });
  }

  async getNote(id) {
    return this.client.get(`/notes/${id}`);
  }

  async createNote(data) {
    return this.client.post('/notes', data);
  }

  async updateNote(id, data) {
    return this.client.put(`/notes/${id}`, data);
  }

  async deleteNote(id) {
    return this.client.delete(`/notes/${id}`);
  }

  // Tenant endpoints
  async getTenantStats() {
    return this.client.get('/tenants/stats');
  }

  async upgradeTenant(slug) {
    return this.client.post(`/tenants/${slug}/upgrade`);
  }

  // User invitation endpoints
  async inviteUser(data) {
    return this.client.post('/users/invite', data);
  }

  async getInvitations() {
    return this.client.get('/users/invitations');
  }

  async getMyInvitations() {
    return this.client.get('/users/my-invitations');
  }

  async cancelInvitation(invitationId) {
    return this.client.delete(`/users/invitations/${invitationId}`);
  }

  async validateInvitationToken(token) {
    return this.client.get(`/users/accept-invitation/${token}`);
  }

  async acceptInvitation(token, userData) {
    return this.client.post(`/users/accept-invitation`, { token, ...userData });
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health');
  }
}

const api = new ApiService();
export default api;
