const express = require('express');
const router = express.Router();
const arrivalController = require('./arrival.controller');
const { authenticate, authorize } = require('../../middlewares/auth');

// ==================== PIN ====================

// Criar/Atualizar PIN
router.post('/pin', authenticate, arrivalController.setPin);

// Verificar PIN
router.post('/pin/verify', authenticate, arrivalController.verifyPin);

// Verificar se tem PIN cadastrado
router.get('/pin/check', authenticate, arrivalController.checkPin);

// ==================== VEÍCULOS ====================

// Listar veículos do usuário
router.get('/vehicles', authenticate, arrivalController.getVehicles);

// Adicionar veículo
router.post('/vehicles', authenticate, arrivalController.addVehicle);

// Atualizar veículo
router.put('/vehicles/:id', authenticate, arrivalController.updateVehicle);

// Remover veículo
router.delete('/vehicles/:id', authenticate, arrivalController.deleteVehicle);

// Definir veículo padrão
router.post('/vehicles/:id/default', authenticate, arrivalController.setDefaultVehicle);

// ==================== AVISOS DE CHEGADA ====================

// Enviar aviso "Estou Chegando"
router.post('/notify', authenticate, arrivalController.sendArrivalNotice);

// Atualizar localização
router.put('/notify/:id/location', authenticate, arrivalController.updateLocation);

// Cancelar aviso
router.post('/notify/:id/cancel', authenticate, arrivalController.cancelArrival);

// Histórico de avisos do usuário
router.get('/notify/history', authenticate, arrivalController.getArrivalHistory);

// ==================== ROTAS DO PORTEIRO ====================

// Listar avisos pendentes (para porteiro)
router.get('/pending', authenticate, authorize(['JANITOR', 'ADMIN', 'MANAGER']), arrivalController.getPendingArrivals);

// Confirmar recebimento do aviso
router.post('/notify/:id/confirm', authenticate, authorize(['JANITOR', 'ADMIN', 'MANAGER']), arrivalController.confirmArrival);

// Marcar como chegou
router.post('/notify/:id/arrived', authenticate, authorize(['JANITOR', 'ADMIN', 'MANAGER']), arrivalController.markAsArrived);

module.exports = router;
