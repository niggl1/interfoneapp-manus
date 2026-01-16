const jwt = require('jsonwebtoken');
const callsService = require('../modules/calls/calls.service');

// Armazenar conexões ativas
const activeConnections = new Map(); // socketId -> { oderId, visitorId }
const userSockets = new Map(); // oderId -> Set<socketId>
const visitorSockets = new Map(); // visitorId -> socketId

/**
 * Configurar handlers de Socket.io para chamadas
 */
const setupCallsHandler = (io) => {
  // Middleware de autenticação opcional
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userType = 'user';
      } catch (error) {
        // Token inválido, mas permitir conexão como visitante
        socket.userType = 'visitor';
      }
    } else {
      socket.userType = 'visitor';
    }
    
    // Gerar ID único para visitantes
    if (socket.userType === 'visitor') {
      socket.visitorId = socket.handshake.auth.visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Nova conexão: ${socket.id} (${socket.userType})`);

    // Registrar conexão
    if (socket.userId) {
      // Usuário autenticado
      if (!userSockets.has(socket.userId)) {
        userSockets.set(socket.userId, new Set());
      }
      userSockets.get(socket.userId).add(socket.id);
      
      // Entrar na sala do usuário
      socket.join(`user:${socket.userId}`);
      
      activeConnections.set(socket.id, { userId: socket.userId });
      
      console.log(`[SOCKET] Usuário ${socket.userId} conectado`);
    } else {
      // Visitante
      visitorSockets.set(socket.visitorId, socket.id);
      activeConnections.set(socket.id, { visitorId: socket.visitorId });
      
      // Enviar ID do visitante
      socket.emit('visitor_id', { visitorId: socket.visitorId });
      
      console.log(`[SOCKET] Visitante ${socket.visitorId} conectado`);
    }

    // ==================== EVENTOS DE CHAMADA ====================

    /**
     * Iniciar chamada
     */
    socket.on('start_call', async (data) => {
      const { receiverId, callerName, type } = data;
      
      try {
        const call = await callsService.createCall({
          callerId: socket.userId || null,
          receiverId,
          callerName: callerName || 'Visitante',
          callerType: socket.userType,
          type: type || 'VIDEO'
        });

        // Entrar na sala da chamada
        socket.join(`call:${call.id}`);

        // Notificar o destinatário
        io.to(`user:${receiverId}`).emit('incoming_call', {
          callId: call.id,
          caller: call.caller || { name: callerName, id: socket.visitorId },
          callerType: call.callerType,
          type: call.type,
          socketId: socket.id
        });

        // Confirmar para o chamador
        socket.emit('call_started', {
          callId: call.id,
          receiver: call.receiver
        });

        console.log(`[SOCKET] Chamada iniciada: ${call.id}`);
      } catch (error) {
        console.error('[SOCKET] Erro ao iniciar chamada:', error);
        socket.emit('call_error', { error: 'Erro ao iniciar chamada' });
      }
    });

    /**
     * Atender chamada
     */
    socket.on('answer_call', async (data) => {
      const { callId } = data;
      
      try {
        const call = await callsService.answerCall(callId);
        
        // Entrar na sala da chamada
        socket.join(`call:${callId}`);

        // Notificar todos na sala
        io.to(`call:${callId}`).emit('call_answered', {
          callId,
          answeredBy: socket.userId
        });

        console.log(`[SOCKET] Chamada atendida: ${callId}`);
      } catch (error) {
        console.error('[SOCKET] Erro ao atender chamada:', error);
        socket.emit('call_error', { error: 'Erro ao atender chamada' });
      }
    });

    /**
     * Rejeitar chamada
     */
    socket.on('reject_call', async (data) => {
      const { callId } = data;
      
      try {
        await callsService.rejectCall(callId);

        // Notificar todos na sala
        io.to(`call:${callId}`).emit('call_rejected', { callId });

        console.log(`[SOCKET] Chamada rejeitada: ${callId}`);
      } catch (error) {
        console.error('[SOCKET] Erro ao rejeitar chamada:', error);
        socket.emit('call_error', { error: 'Erro ao rejeitar chamada' });
      }
    });

    /**
     * Finalizar chamada
     */
    socket.on('end_call', async (data) => {
      const { callId } = data;
      
      try {
        const call = await callsService.endCall(callId);

        // Notificar todos na sala
        io.to(`call:${callId}`).emit('call_ended', {
          callId,
          duration: call.duration
        });

        // Sair da sala
        socket.leave(`call:${callId}`);

        console.log(`[SOCKET] Chamada finalizada: ${callId}`);
      } catch (error) {
        console.error('[SOCKET] Erro ao finalizar chamada:', error);
        socket.emit('call_error', { error: 'Erro ao finalizar chamada' });
      }
    });

    // ==================== EVENTOS DE WEBRTC ====================

    /**
     * Enviar oferta SDP
     */
    socket.on('webrtc_offer', (data) => {
      const { callId, offer, targetSocketId } = data;
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_offer', {
          callId,
          offer,
          fromSocketId: socket.id
        });
      } else {
        socket.to(`call:${callId}`).emit('webrtc_offer', {
          callId,
          offer,
          fromSocketId: socket.id
        });
      }
    });

    /**
     * Enviar resposta SDP
     */
    socket.on('webrtc_answer', (data) => {
      const { callId, answer, targetSocketId } = data;
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_answer', {
          callId,
          answer,
          fromSocketId: socket.id
        });
      } else {
        socket.to(`call:${callId}`).emit('webrtc_answer', {
          callId,
          answer,
          fromSocketId: socket.id
        });
      }
    });

    /**
     * Enviar candidato ICE
     */
    socket.on('webrtc_ice_candidate', (data) => {
      const { callId, candidate, targetSocketId } = data;
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_ice_candidate', {
          callId,
          candidate,
          fromSocketId: socket.id
        });
      } else {
        socket.to(`call:${callId}`).emit('webrtc_ice_candidate', {
          callId,
          candidate,
          fromSocketId: socket.id
        });
      }
    });

    // ==================== EVENTOS DE CONTROLE ====================

    /**
     * Mutar/desmutar áudio
     */
    socket.on('toggle_audio', (data) => {
      const { callId, muted } = data;
      socket.to(`call:${callId}`).emit('peer_audio_toggle', {
        muted,
        peerId: socket.userId || socket.visitorId
      });
    });

    /**
     * Ligar/desligar vídeo
     */
    socket.on('toggle_video', (data) => {
      const { callId, enabled } = data;
      socket.to(`call:${callId}`).emit('peer_video_toggle', {
        enabled,
        peerId: socket.userId || socket.visitorId
      });
    });

    /**
     * Entrar em uma sala de chamada (para reconexão)
     */
    socket.on('join_call', (data) => {
      const { callId } = data;
      socket.join(`call:${callId}`);
      socket.to(`call:${callId}`).emit('peer_joined', {
        peerId: socket.userId || socket.visitorId,
        socketId: socket.id
      });
    });

    // ==================== DESCONEXÃO ====================

    socket.on('disconnect', async () => {
      console.log(`[SOCKET] Desconexão: ${socket.id}`);

      const connection = activeConnections.get(socket.id);
      
      if (connection) {
        if (connection.userId) {
          // Remover socket do usuário
          const sockets = userSockets.get(connection.userId);
          if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              userSockets.delete(connection.userId);
            }
          }
        } else if (connection.visitorId) {
          // Remover socket do visitante
          visitorSockets.delete(connection.visitorId);
        }
        
        activeConnections.delete(socket.id);
      }

      // Notificar salas que o peer desconectou
      socket.rooms.forEach((room) => {
        if (room.startsWith('call:')) {
          socket.to(room).emit('peer_disconnected', {
            peerId: socket.userId || socket.visitorId,
            socketId: socket.id
          });
        }
      });
    });
  });

  return io;
};

module.exports = { setupCallsHandler };
