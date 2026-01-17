const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const notificationsController = require('./notifications.controller');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar notificações
router.get('/', notificationsController.getNotifications);

// Contar notificações não lidas
router.get('/unread/count', notificationsController.getUnreadCount);

// Marcar todas como lidas
router.put('/read-all', notificationsController.markAllAsRead);

// Marcar uma notificação como lida
router.put('/:id/read', notificationsController.markAsRead);

// Excluir notificação
router.delete('/:id', notificationsController.deleteNotification);

// Configurações de notificação
router.get('/settings', notificationsController.getSettings);
router.put('/settings', notificationsController.updateSettings);

module.exports = router;
