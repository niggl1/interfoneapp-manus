const express = require('express');
const { body, param } = require('express-validator');
const callsController = require('./calls.controller');
const { authenticate, optionalAuth } = require('../../middlewares/auth');

const router = express.Router();

// Validações
const initiateCallValidation = [
  body('receiverId').optional().isUUID().withMessage('ID do destinatário inválido'),
  body('unitQrCode').optional().isString().withMessage('QR Code inválido'),
  body('callerName').optional().isString().withMessage('Nome do chamador inválido'),
  body('visitorName').optional().isString().withMessage('Nome do visitante inválido'),
  body('visitorPhone').optional().isString().withMessage('Telefone do visitante inválido'),
  body('type').optional().isIn(['VIDEO', 'AUDIO']).withMessage('Tipo de chamada inválido')
];

// ==================== ROTAS PÚBLICAS (para visitantes) ====================

// Buscar unidade/condomínio por QR Code
router.get('/qrcode/:code', callsController.getByQRCode);

// Buscar moradores de uma unidade
router.get('/unit/:unitId/residents', callsController.getUnitResidents);

// Iniciar chamada (visitante pode chamar sem autenticação)
router.post('/initiate', optionalAuth, initiateCallValidation, callsController.initiateCall);

// Finalizar chamada (visitante pode finalizar)
router.post('/:callId/end', optionalAuth, callsController.endCall);

// ==================== ROTAS AUTENTICADAS ====================

router.use(authenticate);

// Buscar chamada ativa do usuário
router.get('/active', callsController.getActiveCall);

// Buscar histórico de chamadas
router.get('/history', callsController.getCallHistory);

// Buscar detalhes de uma chamada
router.get('/:callId', callsController.getCallDetails);

// Atender chamada
router.post('/:callId/answer', callsController.answerCall);

// Rejeitar chamada
router.post('/:callId/reject', callsController.rejectCall);

module.exports = router;
