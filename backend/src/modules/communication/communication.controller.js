const { validationResult } = require('express-validator');
const communicationService = require('./communication.service');

// ==================== CHAMADAS ====================

/**
 * Iniciar chamada como visitante
 */
const initiateVisitorCall = async (req, res, next) => {
  try {
    const { receiverId, callerName, type = 'VIDEO' } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId é obrigatório' });
    }

    if (!callerName) {
      return res.status(400).json({ error: 'callerName é obrigatório' });
    }

    const io = req.app.get('io');
    const call = await communicationService.initiateVisitorCall(
      { receiverId, callerName, type },
      io
    );

    res.status(201).json({ 
      message: 'Chamada iniciada',
      call 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Iniciar chamada entre usuários
 */
const initiateCall = async (req, res, next) => {
  try {
    const { receiverId, type = 'VIDEO' } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId é obrigatório' });
    }

    const io = req.app.get('io');
    const call = await communicationService.initiateCall(
      { callerId: req.user.id, receiverId, type },
      io
    );

    res.status(201).json({ 
      message: 'Chamada iniciada',
      call 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atender chamada
 */
const answerCall = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const call = await communicationService.answerCall(req.params.id, req.user.id, io);

    res.json({ 
      message: 'Chamada atendida',
      call 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rejeitar chamada
 */
const rejectCall = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const call = await communicationService.rejectCall(req.params.id, req.user.id, io);

    res.json({ 
      message: 'Chamada rejeitada',
      call 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Encerrar chamada
 */
const endCall = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const call = await communicationService.endCall(req.params.id, req.user.id, io);

    res.json({ 
      message: 'Chamada encerrada',
      call 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Histórico de chamadas
 */
const getCallHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await communicationService.getCallHistory(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Detalhes de uma chamada
 */
const getCallById = async (req, res, next) => {
  try {
    const call = await communicationService.getCallById(req.params.id);
    res.json({ call });
  } catch (error) {
    next(error);
  }
};

// ==================== MENSAGENS ====================

/**
 * Enviar mensagem
 */
const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const { receiverId, content } = req.body;
    const io = req.app.get('io');

    const message = await communicationService.sendMessage(
      { senderId: req.user.id, receiverId, content },
      io
    );

    res.status(201).json({ 
      message: 'Mensagem enviada',
      data: message 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar conversas
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await communicationService.getConversations(req.user.id);
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter mensagens de uma conversa
 */
const getConversationMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await communicationService.getConversationMessages(
      req.user.id,
      req.params.userId,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Marcar mensagens como lidas
 */
const markAsRead = async (req, res, next) => {
  try {
    await communicationService.markAsRead(req.user.id, req.params.userId);
    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    next(error);
  }
};

// ==================== COMUNICADOS ====================

/**
 * Listar comunicados
 */
const getAnnouncements = async (req, res, next) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está vinculado a um condomínio' });
    }

    const { page = 1, limit = 20 } = req.query;
    const result = await communicationService.getAnnouncements(
      req.user.condominiumId,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Criar comunicado
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    if (!['ADMIN', 'MANAGER', 'JANITOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para criar comunicados' });
    }

    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está vinculado a um condomínio' });
    }

    const { title, content } = req.body;
    const announcement = await communicationService.createAnnouncement({
      title,
      content,
      condominiumId: req.user.condominiumId,
      authorId: req.user.id
    });

    res.status(201).json({ 
      message: 'Comunicado criado com sucesso',
      announcement 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar comunicado
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    if (!['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para deletar comunicados' });
    }

    await communicationService.deleteAnnouncement(req.params.id);
    res.json({ message: 'Comunicado removido com sucesso' });
  } catch (error) {
    next(error);
  }
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
