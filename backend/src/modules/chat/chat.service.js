const { PrismaClient } = require('@prisma/client');
const notificationsService = require('../notifications/notifications.service');

const prisma = new PrismaClient();

/**
 * Obter conversas do usuário
 */
const getUserConversations = async (userId) => {
  const chatRooms = await prisma.chatRoom.findMany({
    where: {
      members: {
        some: {
          userId,
          leftAt: null
        }
      },
      isActive: true
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
              role: true
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              createdAt: {
                gt: prisma.chatRoomMember.findFirst({
                  where: { chatRoomId: undefined, userId },
                  select: { lastReadAt: true }
                })?.lastReadAt || new Date(0)
              }
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Calcular mensagens não lidas para cada conversa
  const conversationsWithUnread = await Promise.all(
    chatRooms.map(async (room) => {
      const member = await prisma.chatRoomMember.findFirst({
        where: { chatRoomId: room.id, userId }
      });
      
      const unreadCount = await prisma.chatMessage.count({
        where: {
          chatRoomId: room.id,
          createdAt: { gt: member?.lastReadAt || new Date(0) },
          senderId: { not: userId }
        }
      });

      return {
        ...room,
        unreadCount
      };
    })
  );

  return conversationsWithUnread;
};

/**
 * Obter ou criar chat direto entre dois usuários
 */
const getOrCreateDirectChat = async (userId1, userId2) => {
  // Verificar se já existe um chat direto entre os dois
  const existingChat = await prisma.chatRoom.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { members: { some: { userId: userId1 } } },
        { members: { some: { userId: userId2 } } }
      ]
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
              role: true
            }
          }
        }
      }
    }
  });

  if (existingChat) {
    return existingChat;
  }

  // Criar novo chat direto
  const newChat = await prisma.chatRoom.create({
    data: {
      type: 'DIRECT',
      members: {
        create: [
          { userId: userId1 },
          { userId: userId2 }
        ]
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
              role: true
            }
          }
        }
      }
    }
  });

  return newChat;
};

/**
 * Obter ou criar chat de suporte (com portaria/zelador)
 */
const getOrCreateSupportChat = async (userId) => {
  // Buscar dados do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { condominiumId: true }
  });

  if (!user?.condominiumId) {
    const error = new Error('Usuário não está vinculado a um condomínio');
    error.statusCode = 400;
    throw error;
  }

  // Buscar zelador ou admin do condomínio
  const supportUser = await prisma.user.findFirst({
    where: {
      condominiumId: user.condominiumId,
      role: { in: ['JANITOR', 'MANAGER', 'ADMIN'] },
      status: 'ACTIVE'
    },
    orderBy: [
      { role: 'asc' } // Prioriza JANITOR
    ]
  });

  if (!supportUser) {
    const error = new Error('Nenhum atendente disponível no momento');
    error.statusCode = 404;
    throw error;
  }

  // Verificar se já existe chat de suporte
  const existingChat = await prisma.chatRoom.findFirst({
    where: {
      type: 'SUPPORT',
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: supportUser.id } } }
      ]
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
              role: true
            }
          }
        }
      }
    }
  });

  if (existingChat) {
    return existingChat;
  }

  // Criar novo chat de suporte
  const newChat = await prisma.chatRoom.create({
    data: {
      type: 'SUPPORT',
      name: 'Portaria',
      members: {
        create: [
          { userId },
          { userId: supportUser.id, isAdmin: true }
        ]
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
              role: true
            }
          }
        }
      }
    }
  });

  return newChat;
};

/**
 * Obter ou criar chat geral do condomínio
 */
const getOrCreateCondominiumChat = async (userId) => {
  // Buscar dados do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { condominiumId: true }
  });

  if (!user?.condominiumId) {
    const error = new Error('Usuário não está vinculado a um condomínio');
    error.statusCode = 400;
    throw error;
  }

  // Verificar se já existe chat do condomínio
  let condoChat = await prisma.chatRoom.findFirst({
    where: {
      type: 'GROUP',
      condominiumId: user.condominiumId
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true
            }
          }
        }
      },
      condominium: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!condoChat) {
    // Criar chat do condomínio
    const condominium = await prisma.condominium.findUnique({
      where: { id: user.condominiumId }
    });

    condoChat = await prisma.chatRoom.create({
      data: {
        type: 'GROUP',
        name: `Grupo ${condominium.name}`,
        condominiumId: user.condominiumId,
        members: {
          create: { userId, isAdmin: false }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true
              }
            }
          }
        },
        condominium: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  } else {
    // Verificar se usuário já é membro
    const isMember = condoChat.members.some(m => m.user.id === userId);
    
    if (!isMember) {
      // Adicionar usuário ao grupo
      await prisma.chatRoomMember.create({
        data: {
          chatRoomId: condoChat.id,
          userId
        }
      });
      
      // Recarregar chat
      condoChat = await prisma.chatRoom.findUnique({
        where: { id: condoChat.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  role: true
                }
              }
            }
          },
          condominium: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    }
  }

  return condoChat;
};

/**
 * Criar chat com visitante
 */
const createVisitorChat = async (visitorName, visitorPhone, residentId) => {
  const chatRoom = await prisma.chatRoom.create({
    data: {
      type: 'VISITOR',
      name: `Visitante: ${visitorName}`,
      visitorName,
      visitorPhone,
      members: {
        create: { userId: residentId }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true
            }
          }
        }
      }
    }
  });

  return chatRoom;
};

/**
 * Obter mensagens de uma conversa
 */
const getMessages = async (chatRoomId, userId, options = {}) => {
  const { limit = 50, before } = options;

  // Verificar se usuário é membro do chat
  const member = await prisma.chatRoomMember.findFirst({
    where: { chatRoomId, userId }
  });

  // Para chats de visitante, permitir acesso sem ser membro
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId }
  });

  if (!member && chatRoom?.type !== 'VISITOR') {
    const error = new Error('Você não tem acesso a esta conversa');
    error.statusCode = 403;
    throw error;
  }

  const whereClause = {
    chatRoomId,
    ...(before && { createdAt: { lt: new Date(before) } })
  };

  const messages = await prisma.chatMessage.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true
        }
      }
    }
  });

  // Buscar lastReadAt dos outros membros para mostrar confirmação de leitura
  const otherMembers = await prisma.chatRoomMember.findMany({
    where: {
      chatRoomId,
      userId: { not: userId }
    },
    select: {
      userId: true,
      lastReadAt: true,
      user: {
        select: { name: true }
      }
    }
  });

  // Pegar o lastReadAt mais recente dos outros membros
  const lastReadAt = otherMembers.reduce((latest, member) => {
    if (!member.lastReadAt) return latest;
    if (!latest) return member.lastReadAt;
    return new Date(member.lastReadAt) > new Date(latest) ? member.lastReadAt : latest;
  }, null);

  return {
    messages: messages.reverse(),
    lastReadAt: lastReadAt ? lastReadAt.toISOString() : null
  };
};

/**
 * Enviar mensagem
 */
const sendMessage = async (chatRoomId, senderId, content, type = 'text') => {
  // Verificar se usuário é membro do chat
  const member = await prisma.chatRoomMember.findFirst({
    where: { chatRoomId, userId: senderId }
  });

  if (!member) {
    const error = new Error('Você não tem acesso a esta conversa');
    error.statusCode = 403;
    throw error;
  }

  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId,
      senderId,
      content,
      type
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true
        }
      },
      chatRoom: {
        select: {
          id: true,
          name: true,
          type: true,
          members: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  });

  // Atualizar updatedAt do chat room
  await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: { updatedAt: new Date() }
  });

  // Enviar notificação para os outros membros do chat
  try {
    const senderName = message.sender?.name || 'Alguém';
    const chatName = message.chatRoom?.name || 'Chat';
    const isGroup = message.chatRoom?.type === 'GROUP';
    
    // Notificar todos os membros exceto o remetente
    const otherMembers = message.chatRoom?.members?.filter(m => m.userId !== senderId) || [];
    
    for (const memberData of otherMembers) {
      await notificationsService.createNotification({
        userId: memberData.userId,
        type: 'CHAT_MESSAGE',
        title: isGroup ? chatName : `Nova mensagem de ${senderName}`,
        body: isGroup ? `${senderName}: ${content.substring(0, 100)}` : content.substring(0, 100),
        data: {
          chatRoomId: chatRoomId,
          messageId: message.id,
          senderId: senderId,
          senderName: senderName
        }
      });
    }
  } catch (error) {
    console.error('Erro ao enviar notificação de mensagem:', error);
  }

  return message;
};

/**
 * Enviar mensagem como visitante
 */
const sendVisitorMessage = async (chatRoomId, content, senderName) => {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      members: {
        select: {
          userId: true
        }
      }
    }
  });

  if (!chatRoom || chatRoom.type !== 'VISITOR') {
    const error = new Error('Chat não encontrado ou não é um chat de visitante');
    error.statusCode = 404;
    throw error;
  }

  const visitorDisplayName = senderName || chatRoom.visitorName;

  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId,
      content,
      senderName: visitorDisplayName,
      type: 'text'
    }
  });

  // Atualizar updatedAt do chat room
  await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: { updatedAt: new Date() }
  });

  // Enviar notificação push para o morador
  try {
    for (const member of chatRoom.members) {
      await notificationsService.createNotification({
        userId: member.userId,
        type: 'CHAT_MESSAGE',
        title: `Mensagem de ${visitorDisplayName}`,
        body: content.substring(0, 100),
        data: {
          chatRoomId: chatRoomId,
          messageId: message.id,
          visitorName: visitorDisplayName,
          isVisitorChat: true
        }
      });
    }
  } catch (error) {
    console.error('Erro ao enviar notificação de mensagem de visitante:', error);
  }

  return message;
};

/**
 * Marcar mensagens como lidas
 */
const markAsRead = async (chatRoomId, userId) => {
  await prisma.chatRoomMember.updateMany({
    where: { chatRoomId, userId },
    data: { lastReadAt: new Date() }
  });
};

/**
 * Obter contatos para iniciar chat
 */
const getContacts = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { condominiumId: true, role: true }
  });

  if (!user?.condominiumId) {
    return [];
  }

  // Buscar usuários do mesmo condomínio
  const contacts = await prisma.user.findMany({
    where: {
      condominiumId: user.condominiumId,
      id: { not: userId },
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      phone: true,
      role: true,
      unit: {
        select: {
          number: true,
          block: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: [
      { role: 'asc' },
      { name: 'asc' }
    ]
  });

  return contacts;
};

module.exports = {
  getUserConversations,
  getOrCreateDirectChat,
  getOrCreateSupportChat,
  getOrCreateCondominiumChat,
  createVisitorChat,
  getMessages,
  sendMessage,
  sendVisitorMessage,
  markAsRead,
  getContacts
};
