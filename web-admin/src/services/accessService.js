import api from './api';

const accessService = {
  // ==================== VEÍCULOS ====================
  
  getVehicles: async () => {
    const response = await api.get('/access/vehicles');
    return response.data;
  },

  createVehicle: async (data) => {
    const response = await api.post('/access/vehicles', data);
    return response.data;
  },

  updateVehicle: async (id, data) => {
    const response = await api.put(`/access/vehicles/${id}`, data);
    return response.data;
  },

  deleteVehicle: async (id) => {
    const response = await api.delete(`/access/vehicles/${id}`);
    return response.data;
  },

  // ==================== PIN ====================

  checkPin: async () => {
    const response = await api.get('/access/pin/check');
    return response.data;
  },

  setPin: async (pin) => {
    const response = await api.post('/access/pin', { pin });
    return response.data;
  },

  verifyPin: async (pin) => {
    const response = await api.post('/access/pin/verify', { pin });
    return response.data;
  },

  // ==================== AVISOS DE CHEGADA ====================

  createArrivalNotice: async (data) => {
    const response = await api.post('/access/arrival', data);
    return response.data;
  },

  updateArrivalLocation: async (id, latitude, longitude) => {
    const response = await api.put(`/access/arrival/${id}/location`, { latitude, longitude });
    return response.data;
  },

  confirmArrivalNotice: async (id) => {
    const response = await api.post(`/access/arrival/${id}/confirm`);
    return response.data;
  },

  markArrived: async (id) => {
    const response = await api.post(`/access/arrival/${id}/arrived`);
    return response.data;
  },

  cancelArrivalNotice: async (id) => {
    const response = await api.post(`/access/arrival/${id}/cancel`);
    return response.data;
  },

  getActiveArrivalNotices: async () => {
    const response = await api.get('/access/arrival/active');
    return response.data;
  },

  getArrivalHistory: async (page = 1, limit = 20) => {
    const response = await api.get('/access/arrival/history', {
      params: { page, limit }
    });
    return response.data;
  },

  // ==================== LOGS ====================

  getAccessLogs: async (page = 1, limit = 50) => {
    const response = await api.get('/access/logs', {
      params: { page, limit }
    });
    return response.data;
  }
};

export default accessService;
