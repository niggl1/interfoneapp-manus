import api from './api';

// ==================== USUÁRIOS ====================

export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// ==================== MORADORES ====================

export const getResidents = async (condominiumId, unitId) => {
  const params = {};
  if (condominiumId) params.condominiumId = condominiumId;
  if (unitId) params.unitId = unitId;
  const response = await api.get('/users/residents', { params });
  return response.data;
};

// ==================== ZELADORES ====================

export const getJanitors = async (condominiumId) => {
  const params = {};
  if (condominiumId) params.condominiumId = condominiumId;
  const response = await api.get('/users/janitors', { params });
  return response.data;
};
