import api from './api';

const announcementsService = {
  // Listar comunicados
  getAnnouncements: async (page = 1, limit = 20) => {
    const response = await api.get('/communication/announcements', {
      params: { page, limit }
    });
    return response.data;
  },

  // Criar comunicado
  createAnnouncement: async (data) => {
    const response = await api.post('/communication/announcements', data);
    return response.data;
  },

  // Deletar comunicado
  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/communication/announcements/${id}`);
    return response.data;
  }
};

export default announcementsService;
