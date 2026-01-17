import api from './api';

const callsService = {
  // Buscar chamada ativa
  getActiveCall: async () => {
    const response = await api.get('/calls/active');
    return response.data;
  },

  // Buscar histórico de chamadas
  getCallHistory: async (page = 1, limit = 20, type = null, startDate = null, endDate = null) => {
    const params = { page, limit };
    if (type) params.type = type;
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    const response = await api.get('/calls/history', { params });
    return response.data;
  },

  // Buscar detalhes de uma chamada
  getCallDetails: async (callId) => {
    const response = await api.get(`/calls/${callId}`);
    return response.data;
  },

  // Atender chamada
  answerCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/answer`);
    return response.data;
  },

  // Rejeitar chamada
  rejectCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/reject`);
    return response.data;
  },

  // Finalizar chamada
  endCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/end`);
    return response.data;
  }
};

export default callsService;
