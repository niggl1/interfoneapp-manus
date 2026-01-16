import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// API para visitantes (não requer autenticação)
export const visitorApi = {
  // Buscar informações da unidade pelo código do QR
  getUnitByQRCode: async (qrCode) => {
    const response = await api.get(`/visitor/unit/${qrCode}`);
    return response.data;
  },

  // Buscar moradores de uma unidade
  getResidentsByUnit: async (unitId) => {
    const response = await api.get(`/visitor/unit/${unitId}/residents`);
    return response.data;
  },

  // Buscar morador por nome ou apartamento
  searchResidents: async (condominiumId, query) => {
    const response = await api.get(`/visitor/search`, {
      params: { condominiumId, query }
    });
    return response.data;
  },

  // Iniciar chamada para morador
  initiateCall: async (residentId, visitorName) => {
    const response = await api.post('/visitor/call', {
      residentId,
      visitorName
    });
    return response.data;
  },

  // Verificar status da chamada
  getCallStatus: async (callId) => {
    const response = await api.get(`/visitor/call/${callId}/status`);
    return response.data;
  },

  // Encerrar chamada
  endCall: async (callId) => {
    const response = await api.post(`/visitor/call/${callId}/end`);
    return response.data;
  }
};

export default api;
