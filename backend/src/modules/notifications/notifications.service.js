import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../../services/push.service.js';
import * as settingsService from './notification-settings.service.js';

const prisma = new PrismaClient();

/**
 * Cria uma notificação e envia push notification
 * Verifica preferências do usuário antes de enviar
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  data = null,
  sendPush = true,
  checkPreferences = true,
}) {
  // Verifica preferências do usuário
  if (checkPreferences) {
    const shouldNotify = await settingsService.shouldNotify(userId, type);
    if (!shouldNotify) {
      console.log(`Notificação ${type} bloqueada pelas preferências do usuário ${userId}`);
      return null;
    }
  }

  // Criar notificação no banco
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data,
    },
  });

  // Enviar push notification se habilitado
  if (sendPush) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (user?.pushToken) {
      // Busca configurações para verificar som e vibração
      const settings = await settingsService.getSettings(userId);
      
      try {
        await sendPushNotification({
          token: user.pushToken,
          title,
          body,
          data: {
            notificationId: notification.id,
            type,
            ...data,
          },
          sound: settings.soundEnabled,
          vibrate: settings.vibrationEnabled,
        });
      } catch (error) {
        console.error('Erro ao enviar push notification:', error);
      }
    }
  }

  return notification;
}

/**
 * Lista notificações do usuário
 */
export async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
  const where = {
    userId,
    ...(unreadOnly && { read: false }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Conta notificações não lidas
 */
export async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Marca notificação como lida
 */
export async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notificação não encontrada');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Deleta uma notificação
 */
export async function deleteNotification(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notificação não encontrada');
  }

  return prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Notifica morador quando convite é usado
 */
export async function notifyInvitationUsed(invitation, visitorName) {
  return createNotification({
    userId: invitation.hostId,
    type: 'INVITATION_USED',
    title: 'Convite Utilizado',
    body: `${visitorName || invitation.visitorName} utilizou seu convite`,
    data: {
      invitationId: invitation.id,
      invitationCode: invitation.code,
      visitorName: visitorName || invitation.visitorName,
    },
  });
}

/**
 * Notifica morador sobre chamada perdida
 */
export async function notifyMissedCall(call) {
  return createNotification({
    userId: call.receiverId,
    type: 'CALL_MISSED',
    title: 'Chamada Perdida',
    body: `Você perdeu uma chamada de ${call.callerName || 'Visitante'}`,
    data: {
      callId: call.id,
      callerName: call.callerName,
    },
  });
}

/**
 * Notifica sobre novo comunicado
 */
export async function notifyAnnouncement(announcement, userIds) {
  const notifications = userIds.map((userId) =>
    createNotification({
      userId,
      type: 'ANNOUNCEMENT',
      title: 'Novo Comunicado',
      body: announcement.title,
      data: {
        announcementId: announcement.id,
      },
    })
  );

  return Promise.all(notifications);
}

/**
 * Notifica sobre nova mensagem de chat
 */
export async function notifyChatMessage(message, recipientIds, senderName) {
  const notifications = recipientIds.map((userId) =>
    createNotification({
      userId,
      type: 'CHAT_MESSAGE',
      title: senderName || 'Nova Mensagem',
      body: message.content.substring(0, 100),
      data: {
        chatRoomId: message.chatRoomId,
        messageId: message.id,
      },
    })
  );

  return Promise.all(notifications);
}
