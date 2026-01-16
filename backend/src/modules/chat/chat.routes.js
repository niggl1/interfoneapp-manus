const express = require('express');
const { body } = require('express-validator');
const chatController = require('./chat.controller');
const { authenticate, optionalAuth } = require('../../middlewares/auth');

const router = express.Router();

// Validações
const messageValidation = [
  body('content').notEmpty().withMessage('Conteúdo da mensagem é obrigatório'),
  body('type').optional().isIn(['text', 'image', 'audio']).withMessage('Tipo inválido')
];

const visitorChatValidation = [
  body('visitorName').notEmpty().withMessage('Nome do visitante é obrigatório'),
  body('residentId').isUUID().withMessage('ID do morador inválido')
];

// ==================== ROTAS PÚBLICAS (para visitantes) ====================

// Criar chat com visitante (não requer autenticação)
router.post('/visitor', visitorChatValidation, chatController.createVisitorChat);

// Enviar mensagem como visitante
router.post('/visitor/:chatRoomId/messages', chatController.sendVisitorMessage);

// Obter mensagens de chat de visitante
router.get('/visitor/:chatRoomId/messages', chatController.getMessages);

// ==================== ROTAS AUTENTICADAS ====================

router.use(authenticate);

// Listar conversas do usuário
router.get('/conversations', chatController.getConversations);

// Obter contatos para iniciar chat
router.get('/contacts', chatController.getContacts);

// Obter ou criar chat direto com outro usuário
router.get('/direct/:userId', chatController.getOrCreateDirectChat);

// Obter chat de suporte (portaria)
router.get('/support', chatController.getSupportChat);

// Obter chat geral do condomínio
router.get('/condominium', chatController.getCondominiumChat);

// Obter mensagens de uma conversa
router.get('/:chatRoomId/messages', chatController.getMessages);

// Enviar mensagem
router.post('/:chatRoomId/messages', messageValidation, chatController.sendMessage);

// Marcar mensagens como lidas
router.post('/:chatRoomId/read', chatController.markAsRead);

module.exports = router;
