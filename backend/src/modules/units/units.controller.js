const { validationResult } = require('express-validator');
const unitsService = require('./units.service');

// ==================== ROTAS PÚBLICAS ====================

/**
 * Buscar por QR Code (público)
 */
const getByQRCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await unitsService.getByQRCode(code);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar moradores de uma unidade (público - para visitantes)
 */
const getUnitResidentsPublic = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    const residents = await unitsService.getUnitResidentsPublic(unitId);
    res.json({ residents });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar unidades/moradores (público - para visitantes)
 */
const searchUnitsPublic = async (req, res, next) => {
  try {
    const { condominiumId, query } = req.query;

    if (!condominiumId) {
      return res.status(400).json({ error: 'condominiumId é obrigatório' });
    }

    const results = await unitsService.searchUnitsPublic(condominiumId, query);
    res.json({ results });
  } catch (error) {
    next(error);
  }
};

// ==================== CONDOMÍNIOS ====================

/**
 * Listar condomínios
 */
const getCondominiums = async (req, res, next) => {
  try {
    const condominiums = await unitsService.getCondominiums(req.user);
    res.json({ condominiums });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter condomínio por ID
 */
const getCondominiumById = async (req, res, next) => {
  try {
    const condominium = await unitsService.getCondominiumById(req.params.id);
    res.json({ condominium });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar condomínio
 */
const createCondominium = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const condominium = await unitsService.createCondominium(req.body);
    res.status(201).json({ message: 'Condomínio criado com sucesso', condominium });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar condomínio
 */
const updateCondominium = async (req, res, next) => {
  try {
    const condominium = await unitsService.updateCondominium(req.params.id, req.body);
    res.json({ message: 'Condomínio atualizado com sucesso', condominium });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar condomínio
 */
const deleteCondominium = async (req, res, next) => {
  try {
    await unitsService.deleteCondominium(req.params.id);
    res.json({ message: 'Condomínio removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

// ==================== BLOCOS ====================

/**
 * Listar blocos
 */
const getBlocks = async (req, res, next) => {
  try {
    const { condominiumId } = req.query;
    const blocks = await unitsService.getBlocks(condominiumId || req.user.condominiumId);
    res.json({ blocks });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter bloco por ID
 */
const getBlockById = async (req, res, next) => {
  try {
    const block = await unitsService.getBlockById(req.params.id);
    res.json({ block });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar bloco
 */
const createBlock = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const block = await unitsService.createBlock(req.body);
    res.status(201).json({ message: 'Bloco criado com sucesso', block });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar bloco
 */
const updateBlock = async (req, res, next) => {
  try {
    const block = await unitsService.updateBlock(req.params.id, req.body);
    res.json({ message: 'Bloco atualizado com sucesso', block });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar bloco
 */
const deleteBlock = async (req, res, next) => {
  try {
    await unitsService.deleteBlock(req.params.id);
    res.json({ message: 'Bloco removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

// ==================== UNIDADES/APARTAMENTOS ====================

/**
 * Listar unidades
 */
const getUnits = async (req, res, next) => {
  try {
    const { blockId, condominiumId } = req.query;
    const units = await unitsService.getUnits(blockId, condominiumId || req.user.condominiumId);
    res.json({ units });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter unidade por ID
 */
const getUnitById = async (req, res, next) => {
  try {
    const unit = await unitsService.getUnitById(req.params.id);
    res.json({ unit });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter moradores de uma unidade
 */
const getUnitResidents = async (req, res, next) => {
  try {
    const residents = await unitsService.getUnitResidents(req.params.id);
    res.json({ residents });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar unidade
 */
const createUnit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const unit = await unitsService.createUnit(req.body);
    res.status(201).json({ message: 'Unidade criada com sucesso', unit });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar unidade
 */
const updateUnit = async (req, res, next) => {
  try {
    const unit = await unitsService.updateUnit(req.params.id, req.body);
    res.json({ message: 'Unidade atualizada com sucesso', unit });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar unidade
 */
const deleteUnit = async (req, res, next) => {
  try {
    await unitsService.deleteUnit(req.params.id);
    res.json({ message: 'Unidade removida com sucesso' });
  } catch (error) {
    next(error);
  }
};

// ==================== QR CODES ====================

/**
 * Gerar QR Code para unidade
 */
const generateUnitQRCode = async (req, res, next) => {
  try {
    const result = await unitsService.generateUnitQRCode(req.params.id);
    res.json({ message: 'QR Code gerado com sucesso', ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Gerar QR Code para condomínio
 */
const generateCondominiumQRCode = async (req, res, next) => {
  try {
    const result = await unitsService.generateCondominiumQRCode(req.params.id);
    res.json({ message: 'QR Code gerado com sucesso', ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getByQRCode,
  getUnitResidentsPublic,
  searchUnitsPublic,
  getCondominiums,
  getCondominiumById,
  createCondominium,
  updateCondominium,
  deleteCondominium,
  getBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
  getUnits,
  getUnitById,
  getUnitResidents,
  createUnit,
  updateUnit,
  deleteUnit,
  generateUnitQRCode,
  generateCondominiumQRCode
};
