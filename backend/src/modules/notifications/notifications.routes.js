import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import * as notificationsController from './notifications.controller.js';

const router = Router();

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

export default router;
