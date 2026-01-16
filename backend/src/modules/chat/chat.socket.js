const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

/**
 * Configurar handlers de WebSocket para chat
 */
const setupChatSocket = (io) => {
  // Namespace para chat
  const chatNamespace = io.of('/chat');

  chatNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        // Permitir conexão sem autenticação para visitantes
        socket.userId = null;
        socket.isVisitor = true;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.isVisitor = false;
      next();
    } catch (error) {
      // Permitir conexão mesmo com token inválido (para visitantes)
      socket.userId = null;
      socket.isVisitor = true;
      next();
    }
  });

  chatNamespace.on('connection', (socket) => {
    console.log(`[Chat] Conexão: ${socket.id} (userId: ${socket.userId || 'visitante'})`);

    // Entrar em uma sala de chat
    socket.on('join_room', async (chatRoomId) => {
      try {
        // Verificar se o usuário tem acesso ao chat
        if (socket.userId) {
          const member = await prisma.chatRoomMember.findFirst({
            where: { chatRoomId, userId: socket.userId }
          });

          if (!member) {
            // Verificar se é chat de visitante
            const chatRoom = await prisma.chatRoom.findUnique({
              where: { id: chatRoomId }
            });

            if (chatRoom?.type !== 'VISITOR') {
              socket.emit('error', { message: 'Acesso negado' });
              return;
            }
          }
        }

        socket.join(`chat:${chatRoomId}`);
        console.log(`[Chat] ${socket.id} entrou na sala: ${chatRoomId}`);
        
        socket.emit('joined_room', { chatRoomId });
      } catch (error) {
        console.error('[Chat] Erro ao entrar na sala:', error);
        socket.emit('error', { message: 'Erro ao entrar na sala' });
      }
    });

    // Sair de uma sala de chat
    socket.on('leave_room', (chatRoomId) => {
      socket.leave(`chat:${chatRoomId}`);
      console.log(`[Chat] ${socket.id} saiu da sala: ${chatRoomId}`);
    });

    // Enviar mensagem
    socket.on('send_message', async (data) => {
      try {
        const { chatRoomId, content, type = 'text', senderName } = data;

        let message;

        if (socket.userId) {
          // Mensagem de usuário autenticado
          message = await prisma.chatMessage.create({
            data: {
              chatRoomId,
              senderId: socket.userId,
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
              }
            }
          });
        } else {
          // Mensagem de visitante
          message = await prisma.chatMessage.create({
            data: {
              chatRoomId,
              content,
              senderName,
              type: 'text'
            }
          });
        }

        // Atualizar updatedAt do chat room
        await prisma.chatRoom.update({
          where: { id: chatRoomId },
          data: { updatedAt: new Date() }
        });

        // Emitir para todos na sala
        chatNamespace.to(`chat:${chatRoomId}`).emit('new_message', message);

        // Confirmar envio para o remetente
        socket.emit('message_sent', { messageId: message.id });

      } catch (error) {
        console.error('[Chat] Erro ao enviar mensagem:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
      }
    });

    // Indicador de digitação
    socket.on('typing', (data) => {
      const { chatRoomId, isTyping } = data;
      socket.to(`chat:${chatRoomId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Marcar como lido
    socket.on('mark_read', async (chatRoomId) => {
      if (!socket.userId) return;

      try {
        await prisma.chatRoomMember.updateMany({
          where: { chatRoomId, userId: socket.userId },
          data: { lastReadAt: new Date() }
        });

        socket.to(`chat:${chatRoomId}`).emit('messages_read', {
          userId: socket.userId,
          chatRoomId
        });
      } catch (error) {
        console.error('[Chat] Erro ao marcar como lido:', error);
      }
    });

    // Desconexão
    socket.on('disconnect', () => {
      console.log(`[Chat] Desconexão: ${socket.id}`);
    });
  });

  return chatNamespace;
};

module.exports = { setupChatSocket };
