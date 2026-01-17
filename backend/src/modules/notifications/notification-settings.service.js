import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurações padrão
export const DEFAULT_SETTINGS = {
  callsReceived: true,
  callsMissed: true,
  chatMessages: true,
  invitationsUsed: true,
  announcements: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
};

/**
 * Busca as configurações de notificação do usuário
 * Cria configurações padrão se não existirem
 */
export async function getSettings(userId) {
  let settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  // Se não existir, cria com valores padrão
  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: {
        userId,
        ...DEFAULT_SETTINGS,
      },
    });
  }

  return settings;
}

/**
 * Atualiza as configurações de notificação do usuário
 */
export async function updateSettings(userId, data) {
  // Verifica se já existe
  const existing = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  if (existing) {
    // Atualiza
    return prisma.notificationSettings.update({
      where: { userId },
      data,
    });
  } else {
    // Cria com os dados fornecidos
    return prisma.notificationSettings.create({
      data: {
        userId,
        ...DEFAULT_SETTINGS,
        ...data,
      },
    });
  }
}

/**
 * Verifica se o usuário deve receber notificação de um determinado tipo
 */
export async function shouldNotify(userId, notificationType) {
  const settings = await getSettings(userId);

  // Verifica modo silencioso
  if (settings.quietHoursEnabled && settings.quietHoursStart && settings.quietHoursEnd) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const start = settings.quietHoursStart;
    const end = settings.quietHoursEnd;
    
    // Verifica se está no período silencioso
    if (start <= end) {
      // Período normal (ex: 22:00 - 07:00 não cruza meia-noite)
      if (currentTime >= start && currentTime <= end) {
        return false;
      }
    } else {
      // Período que cruza meia-noite (ex: 22:00 - 07:00)
      if (currentTime >= start || currentTime <= end) {
        return false;
      }
    }
  }

  // Verifica tipo de notificação
  switch (notificationType) {
    case 'CALL_RECEIVED':
      return settings.callsReceived;
    case 'CALL_MISSED':
      return settings.callsMissed;
    case 'CHAT_MESSAGE':
      return settings.chatMessages;
    case 'INVITATION_USED':
      return settings.invitationsUsed;
    case 'ANNOUNCEMENT':
      return settings.announcements;
    case 'SYSTEM':
      return true; // Notificações do sistema sempre são enviadas
    default:
      return true;
  }
}
