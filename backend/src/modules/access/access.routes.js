const express = require('express');
const { body } = require('express-validator');
const accessController = require('./access.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// ==================== VEÍCULOS ====================

// Listar veículos do usuário
router.get('/vehicles', accessController.getVehicles);

// Cadastrar veículo
router.post('/vehicles', [
  body('plate').notEmpty().withMessage('Placa é obrigatória'),
  body('model').notEmpty().withMessage('Modelo é obrigatório')
], accessController.createVehicle);

// Atualizar veículo
router.put('/vehicles/:id', accessController.updateVehicle);

// Remover veículo
router.delete('/vehicles/:id', accessController.deleteVehicle);

// ==================== PIN ====================

// Verificar se tem PIN
router.get('/pin/check', accessController.checkPin);

// Configurar PIN
router.post('/pin', accessController.setPin);

// Verificar PIN
router.post('/pin/verify', accessController.verifyPin);

// ==================== AVISOS DE CHEGADA ====================

// Criar aviso de chegada
router.post('/arrival', accessController.createArrivalNotice);

// Atualizar localização
router.put('/arrival/:id/location', accessController.updateArrivalLocation);

// Confirmar aviso (porteiro)
router.post('/arrival/:id/confirm', accessController.confirmArrivalNotice);

// Marcar chegada
router.post('/arrival/:id/arrived', accessController.markArrived);

// Cancelar aviso
router.post('/arrival/:id/cancel', accessController.cancelArrivalNotice);

// Listar avisos ativos (porteiros)
router.get('/arrival/active', accessController.getActiveArrivalNotices);

// Histórico de avisos do usuário
router.get('/arrival/history', accessController.getArrivalHistory);

// ==================== LOGS ====================

// Listar logs de acesso
router.get('/logs', accessController.getAccessLogs);

module.exports = router;
