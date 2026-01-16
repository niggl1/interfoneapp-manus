const express = require('express');
const { body, param } = require('express-validator');
const unitsController = require('./units.controller');
const { authenticate, authorize, optionalAuth } = require('../../middlewares/auth');

const router = express.Router();

// Validações
const condominiumValidation = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('address').notEmpty().withMessage('Endereço é obrigatório'),
  body('city').notEmpty().withMessage('Cidade é obrigatória'),
  body('state').notEmpty().withMessage('Estado é obrigatório'),
  body('zipCode').notEmpty().withMessage('CEP é obrigatório')
];

const blockValidation = [
  body('name').notEmpty().withMessage('Nome do bloco é obrigatório'),
  body('condominiumId').isUUID().withMessage('ID do condomínio inválido')
];

const unitValidation = [
  body('number').notEmpty().withMessage('Número da unidade é obrigatório'),
  body('blockId').isUUID().withMessage('ID do bloco inválido')
];

// ==================== ROTAS PÚBLICAS (para visitantes) ====================

// Buscar condomínio/unidade por QR Code
router.get('/qrcode/:code', unitsController.getByQRCode);

// Buscar moradores de uma unidade (para visitante fazer chamada)
router.get('/public/:unitId/residents', unitsController.getUnitResidentsPublic);

// Buscar unidades/moradores por busca (para visitante)
router.get('/public/search', unitsController.searchUnitsPublic);

// ==================== ROTAS AUTENTICADAS ====================

router.use(authenticate);

// Condomínios
router.get('/condominiums', unitsController.getCondominiums);
router.get('/condominiums/:id', unitsController.getCondominiumById);
router.post('/condominiums', authorize('ADMIN'), condominiumValidation, unitsController.createCondominium);
router.put('/condominiums/:id', authorize('ADMIN', 'MANAGER'), unitsController.updateCondominium);
router.delete('/condominiums/:id', authorize('ADMIN'), unitsController.deleteCondominium);

// Blocos
router.get('/blocks', unitsController.getBlocks);
router.get('/blocks/:id', unitsController.getBlockById);
router.post('/blocks', authorize('ADMIN', 'MANAGER'), blockValidation, unitsController.createBlock);
router.put('/blocks/:id', authorize('ADMIN', 'MANAGER'), unitsController.updateBlock);
router.delete('/blocks/:id', authorize('ADMIN', 'MANAGER'), unitsController.deleteBlock);

// Unidades/Apartamentos
router.get('/apartments', unitsController.getUnits);
router.get('/apartments/:id', unitsController.getUnitById);
router.get('/apartments/:id/residents', unitsController.getUnitResidents);
router.post('/apartments', authorize('ADMIN', 'MANAGER'), unitValidation, unitsController.createUnit);
router.put('/apartments/:id', authorize('ADMIN', 'MANAGER'), unitsController.updateUnit);
router.delete('/apartments/:id', authorize('ADMIN', 'MANAGER'), unitsController.deleteUnit);

// QR Codes
router.post('/apartments/:id/qrcode', authorize('ADMIN', 'MANAGER'), unitsController.generateUnitQRCode);
router.post('/condominiums/:id/qrcode', authorize('ADMIN', 'MANAGER'), unitsController.generateCondominiumQRCode);

module.exports = router;
