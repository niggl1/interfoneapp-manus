const { validationResult } = require('express-validator');
const chatService = require('./chat.service');

/**
 * Listar conversas do usuário
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getUserConversations(req.user.id);
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter ou criar conversa direta com outro usuário
 */
const getOrCreateDirectChat = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const chatRoom = await chatService.getOrCreateDirectChat(req.user.id, userId);
    res.json({ chatRoom });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter chat de suporte (com portaria)
 */
const getSupportChat = async (req, res, next) => {
  try {
    const chatRoom = await chatService.getOrCreateSupportChat(req.user.id);
    res.json({ chatRoom });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter chat geral do condomínio
 */
const getCondominiumChat = async (req, res, next) => {
  try {
    const chatRoom = await chatService.getOrCreateCondominiumChat(req.user.id);
    res.json({ chatRoom });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar chat com visitante
 */
const createVisitorChat = async (req, res, next) => {
  try {
    const { visitorName, visitorPhone, residentId } = req.body;
    const chatRoom = await chatService.createVisitorChat(visitorName, visitorPhone, residentId);
    res.status(201).json({ chatRoom });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter mensagens de uma conversa
 */
const getMessages = async (req, res, next) => {
  try {
    const { chatRoomId } = req.params;
    const { limit = 50, before } = req.query;
    
    const messages = await chatService.getMessages(chatRoomId, req.user.id, {
      limit: parseInt(limit),
      before
    });
    
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

/**
 * Enviar mensagem
 */
const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const { chatRoomId } = req.params;
    const { content, type = 'text' } = req.body;
    
    const message = await chatService.sendMessage(chatRoomId, req.user.id, content, type);
    
    // Emitir via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatRoomId}`).emit('new_message', message);
    }
    
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

/**
 * Enviar mensagem como visitante
 */
const sendVisitorMessage = async (req, res, next) => {
  try {
    const { chatRoomId } = req.params;
    const { content, senderName } = req.body;
    
    const message = await chatService.sendVisitorMessage(chatRoomId, content, senderName);
    
    // Emitir via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatRoomId}`).emit('new_message', message);
    }
    
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

/**
 * Marcar mensagens como lidas
 */
const markAsRead = async (req, res, next) => {
  try {
    const { chatRoomId } = req.params;
    await chatService.markAsRead(chatRoomId, req.user.id);
    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter contatos para iniciar chat
 */
const getContacts = async (req, res, next) => {
  try {
    const contacts = await chatService.getContacts(req.user.id);
    res.json({ contacts });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateDirectChat,
  getSupportChat,
  getCondominiumChat,
  createVisitorChat,
  getMessages,
  sendMessage,
  sendVisitorMessage,
  markAsRead,
  getContacts
};
