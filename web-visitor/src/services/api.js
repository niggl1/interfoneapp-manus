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
    const response = await api.get(`/calls/qrcode/${qrCode}`);
    return response.data;
  },

  // Buscar moradores de uma unidade
  getResidentsByUnit: async (unitId) => {
    const response = await api.get(`/calls/unit/${unitId}/residents`);
    return response.data;
  },

  // Buscar unidades/moradores por busca (para visitante)
  searchUnits: async (query) => {
    const response = await api.get(`/units/public/search`, {
      params: { query }
    });
    return response.data;
  },

  // Iniciar chamada para morador
  initiateCall: async (receiverId, callerName, type = 'VIDEO') => {
    const response = await api.post('/calls/initiate', {
      receiverId,
      callerName,
      callerType: 'visitor',
      type
    });
    return response.data;
  },

  // Encerrar chamada
  endCall: async (callId) => {
    const response = await api.post(`/calls/${callId}/end`);
    return response.data;
  }
};

export default api;
