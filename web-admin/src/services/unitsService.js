import api from './api';

// ==================== CONDOMÍNIOS ====================

export const getCondominiums = async () => {
  const response = await api.get('/units/condominiums');
  return response.data;
};

export const getCondominiumById = async (id) => {
  const response = await api.get(`/units/condominiums/${id}`);
  return response.data;
};

export const createCondominium = async (data) => {
  const response = await api.post('/units/condominiums', data);
  return response.data;
};

export const updateCondominium = async (id, data) => {
  const response = await api.put(`/units/condominiums/${id}`, data);
  return response.data;
};

export const deleteCondominium = async (id) => {
  const response = await api.delete(`/units/condominiums/${id}`);
  return response.data;
};

// ==================== BLOCOS ====================

export const getBlocks = async (condominiumId) => {
  const params = condominiumId ? { condominiumId } : {};
  const response = await api.get('/units/blocks', { params });
  return response.data;
};

export const getBlockById = async (id) => {
  const response = await api.get(`/units/blocks/${id}`);
  return response.data;
};

export const createBlock = async (data) => {
  const response = await api.post('/units/blocks', data);
  return response.data;
};

export const updateBlock = async (id, data) => {
  const response = await api.put(`/units/blocks/${id}`, data);
  return response.data;
};

export const deleteBlock = async (id) => {
  const response = await api.delete(`/units/blocks/${id}`);
  return response.data;
};

// ==================== APARTAMENTOS ====================

export const getUnits = async (blockId, condominiumId) => {
  const params = {};
  if (blockId) params.blockId = blockId;
  if (condominiumId) params.condominiumId = condominiumId;
  const response = await api.get('/units/apartments', { params });
  return response.data;
};

export const getUnitById = async (id) => {
  const response = await api.get(`/units/apartments/${id}`);
  return response.data;
};

export const createUnit = async (data) => {
  const response = await api.post('/units/apartments', data);
  return response.data;
};

export const updateUnit = async (id, data) => {
  const response = await api.put(`/units/apartments/${id}`, data);
  return response.data;
};

export const deleteUnit = async (id) => {
  const response = await api.delete(`/units/apartments/${id}`);
  return response.data;
};

export const generateUnitQRCode = async (id) => {
  const response = await api.post(`/units/apartments/${id}/qrcode`);
  return response.data;
};

export const generateCondominiumQRCode = async (id) => {
  const response = await api.post(`/units/condominiums/${id}/qrcode`);
  return response.data;
};
