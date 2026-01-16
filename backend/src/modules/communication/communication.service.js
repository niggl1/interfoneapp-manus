const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ==================== CHAMADAS ====================

/**
 * Iniciar chamada como visitante
 */
const initiateVisitorCall = async ({ receiverId, callerName, type }, io) => {
  // Verificar se o destinatário existe
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, name: true, pushToken: true }
  });

  if (!receiver) {
    const error = new Error('Destinatário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Criar registro da chamada
  const call = await prisma.call.create({
    data: {
      receiverId,
      callerName,
      callerType: 'visitor',
      type,
      status: 'RINGING'
    }
  });

  // Emitir evento via Socket.io
  if (io) {
    io.to(`user:${receiverId}`).emit('incoming_call', {
      callId: call.id,
      callerName,
      callerType: 'visitor',
      type
    });
  }

  // TODO: Enviar push notification

  return call;
};

/**
 * Iniciar chamada entre usuários
 */
const initiateCall = async ({ callerId, receiverId, type }, io) => {
  // Verificar se o destinatário existe
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, name: true, pushToken: true }
  });

  if (!receiver) {
    const error = new Error('Destinatário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Buscar dados do chamador
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { id: true, name: true, avatar: true }
  });

  // Criar registro da chamada
  const call = await prisma.call.create({
    data: {
      callerId,
      receiverId,
      callerType: 'user',
      type,
      status: 'RINGING'
    }
  });

  // Emitir evento via Socket.io
  if (io) {
    io.to(`user:${receiverId}`).emit('incoming_call', {
      callId: call.id,
      caller: {
        id: caller.id,
        name: caller.name,
        avatar: caller.avatar
      },
      callerType: 'user',
      type
    });
  }

  // TODO: Enviar push notification

  return call;
};

/**
 * Atender chamada
 */
const answerCall = async (callId, userId, io) => {
  const call = await prisma.call.findUnique({
    where: { id: callId }
  });

  if (!call) {
    const error = new Error('Chamada não encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (call.receiverId !== userId) {
    const error = new Error('Você não pode atender esta chamada');
    error.statusCode = 403;
    throw error;
  }

  if (call.status !== 'RINGING') {
    const error = new Error('Chamada não está mais disponível');
    error.statusCode = 400;
    throw error;
  }

  const updatedCall = await prisma.call.update({
    where: { id: callId },
    data: {
      status: 'ANSWERED',
      answeredAt: new Date()
    }
  });

  // Notificar o chamador
  if (io) {
    if (call.callerId) {
      io.to(`user:${call.callerId}`).emit('call_answered', { callId });
    }
    // Para visitantes, notificar via room da chamada
    io.to(`call:${callId}`).emit('call_answered', { callId });
  }

  return updatedCall;
};

/**
 * Rejeitar chamada
 */
const rejectCall = async (callId, userId, io) => {
  const call = await prisma.call.findUnique({
    where: { id: callId }
  });

  if (!call) {
    const error = new Error('Chamada não encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (call.receiverId !== userId) {
    const error = new Error('Você não pode rejeitar esta chamada');
    error.statusCode = 403;
    throw error;
  }

  const updatedCall = await prisma.call.update({
    where: { id: callId },
    data: {
      status: 'REJECTED',
      endedAt: new Date()
    }
  });

  // Notificar o chamador
  if (io) {
    if (call.callerId) {
      io.to(`user:${call.callerId}`).emit('call_rejected', { callId });
    }
    io.to(`call:${callId}`).emit('call_rejected', { callId });
  }

  return updatedCall;
};

/**
 * Encerrar chamada
 */
const endCall = async (callId, userId, io) => {
  const call = await prisma.call.findUnique({
    where: { id: callId }
  });

  if (!call) {
    const error = new Error('Chamada não encontrada');
    error.statusCode = 404;
    throw error;
  }

  // Calcular duração se a chamada foi atendida
  let duration = null;
  if (call.answeredAt) {
    duration = Math.floor((new Date() - call.answeredAt) / 1000);
  }

  const status = call.status === 'RINGING' ? 'MISSED' : 'ENDED';

  const updatedCall = await prisma.call.update({
    where: { id: callId },
    data: {
      status,
      endedAt: new Date(),
      duration
    }
  });

  // Notificar ambas as partes
  if (io) {
    if (call.callerId) {
      io.to(`user:${call.callerId}`).emit('call_ended', { callId, duration });
    }
    io.to(`user:${call.receiverId}`).emit('call_ended', { callId, duration });
    io.to(`call:${callId}`).emit('call_ended', { callId, duration });
  }

  return updatedCall;
};

/**
 * Histórico de chamadas
 */
const getCallHistory = async (userId, page = 1, limit = 20) => {
  const where = {
    OR: [
      { callerId: userId },
      { receiverId: userId }
    ]
  };

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        caller: {
          select: { id: true, name: true, avatar: true }
        },
        receiver: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.call.count({ where })
  ]);

  return {
    calls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Obter chamada por ID
 */
const getCallById = async (callId) => {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      caller: {
        select: { id: true, name: true, avatar: true }
      },
      receiver: {
        select: { id: true, name: true, avatar: true }
      }
    }
  });

  if (!call) {
    const error = new Error('Chamada não encontrada');
    error.statusCode = 404;
    throw error;
  }

  return call;
};

// ==================== MENSAGENS ====================

/**
 * Enviar mensagem
 */
const sendMessage = async ({ senderId, receiverId, content }, io) => {
  // Verificar se o destinatário existe
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, pushToken: true }
  });

  if (!receiver) {
    const error = new Error('Destinatário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content,
      status: 'SENT'
    },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true }
      }
    }
  });

  // Emitir evento via Socket.io
  if (io) {
    io.to(`user:${receiverId}`).emit('new_message', {
      message: {
        id: message.id,
        content: message.content,
        sender: message.sender,
        createdAt: message.createdAt
      }
    });
  }

  // TODO: Enviar push notification

  return message;
};

/**
 * Listar conversas
 */
const getConversations = async (userId) => {
  // Buscar todas as mensagens do usuário
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, role: true }
      },
      receiver: {
        select: { id: true, name: true, avatar: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Agrupar por conversa
  const conversationsMap = new Map();

  messages.forEach(msg => {
    const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, {
        user: otherUser,
        lastMessage: {
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          isFromMe: msg.senderId === userId
        },
        unreadCount: 0
      });
    }

    // Contar não lidas
    if (msg.receiverId === userId && msg.status !== 'READ') {
      const conv = conversationsMap.get(otherUserId);
      conv.unreadCount++;
    }
  });

  return Array.from(conversationsMap.values());
};

/**
 * Obter mensagens de uma conversa
 */
const getConversationMessages = async (userId, otherUserId, page = 1, limit = 50) => {
  const where = {
    OR: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId }
    ]
  };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.message.count({ where })
  ]);

  return {
    messages: messages.reverse(), // Ordem cronológica
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Marcar mensagens como lidas
 */
const markAsRead = async (userId, senderId) => {
  await prisma.message.updateMany({
    where: {
      senderId,
      receiverId: userId,
      status: { not: 'READ' }
    },
    data: {
      status: 'READ',
      readAt: new Date()
    }
  });
};

// ==================== COMUNICADOS ====================

/**
 * Listar comunicados
 */
const getAnnouncements = async (condominiumId, page = 1, limit = 20) => {
  const where = { condominiumId };

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.announcement.count({ where })
  ]);

  return {
    announcements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Criar comunicado
 */
const createAnnouncement = async ({ title, content, condominiumId, authorId }) => {
  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      condominiumId,
      authorId
    }
  });

  return announcement;
};

/**
 * Deletar comunicado
 */
const deleteAnnouncement = async (id) => {
  await prisma.announcement.delete({ where: { id } });
};

module.exports = {
  initiateVisitorCall,
  initiateCall,
  answerCall,
  rejectCall,
  endCall,
  getCallHistory,
  getCallById,
  sendMessage,
  getConversations,
  getConversationMessages,
  markAsRead,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
};
