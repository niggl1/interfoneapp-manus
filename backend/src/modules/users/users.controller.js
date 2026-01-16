const { validationResult } = require('express-validator');
const usersService = require('./users.service');

/**
 * Obter perfil do usuário autenticado
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar perfil do usuário autenticado
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const { name, phone, avatar } = req.body;
    const user = await usersService.updateUser(req.user.id, { name, phone, avatar });

    res.json({ message: 'Perfil atualizado com sucesso', user });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar moradores do condomínio
 */
const getResidents = async (req, res, next) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está vinculado a um condomínio' });
    }

    const residents = await usersService.getResidentsByCondominium(req.user.condominiumId);
    res.json({ residents });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar zeladores do condomínio
 */
const getJanitors = async (req, res, next) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está vinculado a um condomínio' });
    }

    const janitors = await usersService.getJanitorsByCondominium(req.user.condominiumId);
    res.json({ janitors });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar contatos disponíveis para chamadas/mensagens
 */
const getContacts = async (req, res, next) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está vinculado a um condomínio' });
    }

    const contacts = await usersService.getContactsByCondominium(
      req.user.condominiumId,
      req.user.id
    );
    res.json({ contacts });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar todos os usuários (admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    
    const filters = {
      condominiumId: req.user.condominiumId,
      role,
      status,
      search
    };

    const result = await usersService.getAllUsers(filters, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obter usuário por ID (admin)
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar status do usuário (admin)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const { status } = req.body;
    const user = await usersService.updateUserStatus(req.params.id, status);

    res.json({ message: 'Status atualizado com sucesso', user });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar role do usuário (admin)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const { role } = req.body;
    const user = await usersService.updateUserRole(req.params.id, role);

    res.json({ message: 'Role atualizada com sucesso', user });
  } catch (error) {
    next(error);
  }
};

/**
 * Vincular usuário a uma unidade (admin)
 */
const assignUserToUnit = async (req, res, next) => {
  try {
    const { unitId, condominiumId } = req.body;

    if (!unitId && !condominiumId) {
      return res.status(400).json({ error: 'unitId ou condominiumId é obrigatório' });
    }

    const user = await usersService.assignUserToUnit(req.params.id, unitId, condominiumId);

    res.json({ message: 'Usuário vinculado com sucesso', user });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar usuário (admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    await usersService.deleteUser(req.params.id);
    res.json({ message: 'Usuário removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getResidents,
  getJanitors,
  getContacts,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  assignUserToUnit,
  deleteUser
};
