const express = require('express');
const { body, param, query } = require('express-validator');
const communicationController = require('./communication.controller');
const { authenticate, optionalAuth } = require('../../middlewares/auth');

const router = express.Router();

// ==================== ROTAS PÚBLICAS (para visitantes) ====================

// Iniciar chamada como visitante
router.post('/calls/visitor', communicationController.initiateVisitorCall);

// ==================== ROTAS AUTENTICADAS ====================

router.use(authenticate);

// ==================== CHAMADAS ====================

// Iniciar chamada
router.post('/calls', communicationController.initiateCall);

// Atender chamada
router.post('/calls/:id/answer', communicationController.answerCall);

// Rejeitar chamada
router.post('/calls/:id/reject', communicationController.rejectCall);

// Encerrar chamada
router.post('/calls/:id/end', communicationController.endCall);

// Histórico de chamadas
router.get('/calls/history', communicationController.getCallHistory);

// Detalhes de uma chamada
router.get('/calls/:id', communicationController.getCallById);

// ==================== MENSAGENS ====================

// Enviar mensagem
router.post('/messages', [
  body('receiverId').isUUID().withMessage('ID do destinatário inválido'),
  body('content').notEmpty().withMessage('Conteúdo da mensagem é obrigatório')
], communicationController.sendMessage);

// Listar conversas
router.get('/conversations', communicationController.getConversations);

// Obter mensagens de uma conversa
router.get('/conversations/:userId', communicationController.getConversationMessages);

// Marcar mensagens como lidas
router.post('/conversations/:userId/read', communicationController.markAsRead);

// ==================== COMUNICADOS ====================

// Listar comunicados
router.get('/announcements', communicationController.getAnnouncements);

// Criar comunicado (apenas admin/manager)
router.post('/announcements', [
  body('title').notEmpty().withMessage('Título é obrigatório'),
  body('content').notEmpty().withMessage('Conteúdo é obrigatório')
], communicationController.createAnnouncement);

// Deletar comunicado
router.delete('/announcements/:id', communicationController.deleteAnnouncement);

module.exports = router;
