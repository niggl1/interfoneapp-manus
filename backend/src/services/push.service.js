const { Expo } = require('expo-server-sdk');

// Criar instância do Expo SDK
const expo = new Expo();

/**
 * Enviar notificação push para um único token
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  // Verificar se o token é válido
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token inválido: ${pushToken}`);
    return null;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: data.type === 'INCOMING_CALL' ? 'calls' : 'general',
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification enviada:', tickets);
    return tickets[0];
  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
    return null;
  }
};

/**
 * Enviar notificação push para múltiplos tokens
 */
const sendPushNotifications = async (pushTokens, title, body, data = {}) => {
  // Filtrar tokens válidos
  const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    console.log('Nenhum token válido para enviar notificação');
    return [];
  }

  const messages = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: data.type === 'INCOMING_CALL' ? 'calls' : 'general',
  }));

  // Dividir em chunks de 100 (limite do Expo)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Erro ao enviar chunk de push notifications:', error);
    }
  }

  console.log(`Push notifications enviadas: ${tickets.length} de ${validTokens.length}`);
  return tickets;
};

/**
 * Enviar notificação de chamada recebida
 */
const sendIncomingCallNotification = async (pushToken, visitorName, callId) => {
  return sendPushNotification(
    pushToken,
    'Chamada de Visitante',
    `${visitorName} está chamando no interfone`,
    {
      type: 'INCOMING_CALL',
      callId,
      title: visitorName,
    }
  );
};

/**
 * Enviar notificação de novo comunicado
 */
const sendAnnouncementNotification = async (pushTokens, title, announcementId) => {
  return sendPushNotifications(
    pushTokens,
    'Novo Comunicado',
    title,
    {
      type: 'ANNOUNCEMENT',
      announcementId,
      title,
    }
  );
};

/**
 * Enviar notificação de acesso liberado
 */
const sendAccessGrantedNotification = async (pushToken, message) => {
  return sendPushNotification(
    pushToken,
    'Acesso Liberado',
    message,
    {
      type: 'ACCESS_GRANTED',
    }
  );
};

module.exports = {
  sendPushNotification,
  sendPushNotifications,
  sendIncomingCallNotification,
  sendAnnouncementNotification,
  sendAccessGrantedNotification,
};
