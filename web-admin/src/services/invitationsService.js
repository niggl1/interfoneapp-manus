import api from './api';

const invitationsService = {
  // Buscar todos os convites do condomínio (admin)
  getAllInvitations: async (page = 1, limit = 20, status = undefined) => {
    const params = { page, limit };
    if (status) params.status = status;
    const response = await api.get('/invitations/admin', { params });
    return response.data;
  },

  // Buscar convite por ID
  getInvitation: async (id) => {
    const response = await api.get(`/invitations/${id}`);
    return response.data;
  },

  // Cancelar convite
  cancelInvitation: async (id) => {
    const response = await api.delete(`/invitations/${id}`);
    return response.data;
  },

  // Buscar estatísticas de convites
  getStats: async () => {
    const response = await api.get('/invitations/stats');
    return response.data;
  }
};

export default invitationsService;
