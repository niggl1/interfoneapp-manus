const jwt = require('jsonwebtoken');

/**
 * Configurar handlers do Socket.io para comunicação em tempo real
 */
const setupSocketHandlers = (io) => {
  // Middleware de autenticação para Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      // Permitir conexões sem token (visitantes)
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.userId };
      next();
    } catch (error) {
      // Permitir conexão mesmo com token inválido (para visitantes)
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    // Se usuário autenticado, entrar na sala do usuário
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      console.log(`👤 Usuário ${socket.user.id} conectado`);
    }

    // ==================== EVENTOS DE CHAMADA ====================

    /**
     * Entrar na sala de uma chamada
     */
    socket.on('join_call', (data) => {
      const { callId } = data;
      socket.join(`call:${callId}`);
      console.log(`📞 Socket ${socket.id} entrou na chamada ${callId}`);

      // Notificar outros participantes
      socket.to(`call:${callId}`).emit('peer_joined', {
        peerId: socket.id
      });
    });

    /**
     * Sair da sala de uma chamada
     */
    socket.on('leave_call', (data) => {
      const { callId } = data;
      socket.leave(`call:${callId}`);
      console.log(`📞 Socket ${socket.id} saiu da chamada ${callId}`);

      // Notificar outros participantes
      socket.to(`call:${callId}`).emit('peer_left', {
        peerId: socket.id
      });
    });

    /**
     * Sinalização WebRTC - Offer
     */
    socket.on('webrtc_offer', (data) => {
      const { callId, offer, targetPeerId } = data;

      if (targetPeerId) {
        // Enviar para peer específico
        io.to(targetPeerId).emit('webrtc_offer', {
          offer,
          peerId: socket.id
        });
      } else {
        // Broadcast para a sala da chamada
        socket.to(`call:${callId}`).emit('webrtc_offer', {
          offer,
          peerId: socket.id
        });
      }
    });

    /**
     * Sinalização WebRTC - Answer
     */
    socket.on('webrtc_answer', (data) => {
      const { callId, answer, targetPeerId } = data;

      if (targetPeerId) {
        io.to(targetPeerId).emit('webrtc_answer', {
          answer,
          peerId: socket.id
        });
      } else {
        socket.to(`call:${callId}`).emit('webrtc_answer', {
          answer,
          peerId: socket.id
        });
      }
    });

    /**
     * Sinalização WebRTC - ICE Candidate
     */
    socket.on('webrtc_ice_candidate', (data) => {
      const { callId, candidate, targetPeerId } = data;

      if (targetPeerId) {
        io.to(targetPeerId).emit('webrtc_ice_candidate', {
          candidate,
          peerId: socket.id
        });
      } else {
        socket.to(`call:${callId}`).emit('webrtc_ice_candidate', {
          candidate,
          peerId: socket.id
        });
      }
    });

    // ==================== EVENTOS DE MENSAGEM ====================

    /**
     * Usuário está digitando
     */
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      if (socket.user) {
        io.to(`user:${receiverId}`).emit('user_typing', {
          userId: socket.user.id
        });
      }
    });

    /**
     * Usuário parou de digitar
     */
    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      if (socket.user) {
        io.to(`user:${receiverId}`).emit('user_stopped_typing', {
          userId: socket.user.id
        });
      }
    });

    // ==================== EVENTOS DE PRESENÇA ====================

    /**
     * Atualizar status online
     */
    socket.on('update_presence', (data) => {
      const { status } = data; // 'online', 'away', 'busy'
      if (socket.user) {
        // Broadcast para contatos do usuário
        socket.broadcast.emit('presence_update', {
          userId: socket.user.id,
          status
        });
      }
    });

    // ==================== DESCONEXÃO ====================

    socket.on('disconnect', () => {
      console.log(`🔌 Socket desconectado: ${socket.id}`);

      if (socket.user) {
        // Notificar que usuário ficou offline
        socket.broadcast.emit('presence_update', {
          userId: socket.user.id,
          status: 'offline'
        });
      }
    });
  });

  console.log('📡 Socket.io handlers configurados');
};

module.exports = setupSocketHandlers;
