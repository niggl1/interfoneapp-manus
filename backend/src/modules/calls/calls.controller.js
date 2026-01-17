const callsService = require('./calls.service');
const { validationResult } = require('express-validator');

/**
 * Iniciar uma chamada
 */
const initiateCall = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { receiverId, callerName, callerType, type, unitQrCode, visitorName, visitorPhone } = req.body;
    const callerId = req.user?.id || null;

    // Se foi passado QR Code em vez de receiverId, buscar o morador da unidade
    if (!receiverId && unitQrCode) {
      const unitData = await callsService.getUnitByQRCode(unitQrCode);
      if (!unitData || !unitData.unit) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }
      
      // Pegar o primeiro morador da unidade
      if (unitData.unit.residents && unitData.unit.residents.length > 0) {
        receiverId = unitData.unit.residents[0].id;
      } else {
        return res.status(404).json({ error: 'Nenhum morador encontrado nesta unidade' });
      }
    }

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId ou unitQrCode é obrigatório' });
    }

    const call = await callsService.createCall({
      callerId,
      receiverId,
      callerName: visitorName || callerName || req.user?.name,
      callerType: callerType || (req.user ? 'user' : 'visitor'),
      type,
      visitorPhone
    });

    // Emitir evento de chamada via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${receiverId}`).emit('incoming_call', {
        callId: call.id,
        caller: call.caller || { name: callerName },
        callerType: call.callerType,
        type: call.type
      });
    }

    res.status(201).json({
      message: 'Chamada iniciada',
      call
    });
  } catch (error) {
    console.error('[CALLS] Erro ao iniciar chamada:', error);
    res.status(500).json({ error: 'Erro ao iniciar chamada' });
  }
};

/**
 * Atender uma chamada
 */
const answerCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await callsService.getCallById(callId);
    if (!call) {
      return res.status(404).json({ error: 'Chamada não encontrada' });
    }

    if (call.receiverId !== userId) {
      return res.status(403).json({ error: 'Você não pode atender esta chamada' });
    }

    if (call.status !== 'RINGING') {
      return res.status(400).json({ error: 'Esta chamada não pode ser atendida' });
    }

    const updatedCall = await callsService.answerCall(callId);

    // Notificar o chamador que a chamada foi atendida
    const io = req.app.get('io');
    if (io) {
      if (call.callerId) {
        io.to(`user:${call.callerId}`).emit('call_answered', { callId });
      }
      io.to(`call:${callId}`).emit('call_answered', { callId });
    }

    res.json({
      message: 'Chamada atendida',
      call: updatedCall
    });
  } catch (error) {
    console.error('[CALLS] Erro ao atender chamada:', error);
    res.status(500).json({ error: 'Erro ao atender chamada' });
  }
};

/**
 * Rejeitar uma chamada
 */
const rejectCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await callsService.getCallById(callId);
    if (!call) {
      return res.status(404).json({ error: 'Chamada não encontrada' });
    }

    if (call.receiverId !== userId) {
      return res.status(403).json({ error: 'Você não pode rejeitar esta chamada' });
    }

    if (call.status !== 'RINGING') {
      return res.status(400).json({ error: 'Esta chamada não pode ser rejeitada' });
    }

    const updatedCall = await callsService.rejectCall(callId);

    // Notificar o chamador que a chamada foi rejeitada
    const io = req.app.get('io');
    if (io) {
      if (call.callerId) {
        io.to(`user:${call.callerId}`).emit('call_rejected', { callId });
      }
      io.to(`call:${callId}`).emit('call_rejected', { callId });
    }

    res.json({
      message: 'Chamada rejeitada',
      call: updatedCall
    });
  } catch (error) {
    console.error('[CALLS] Erro ao rejeitar chamada:', error);
    res.status(500).json({ error: 'Erro ao rejeitar chamada' });
  }
};

/**
 * Finalizar uma chamada
 */
const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user?.id;

    const call = await callsService.getCallById(callId);
    if (!call) {
      return res.status(404).json({ error: 'Chamada não encontrada' });
    }

    // Verificar se o usuário é parte da chamada
    if (userId && call.callerId !== userId && call.receiverId !== userId) {
      return res.status(403).json({ error: 'Você não pode finalizar esta chamada' });
    }

    const updatedCall = await callsService.endCall(callId);

    // Notificar ambas as partes que a chamada foi finalizada
    const io = req.app.get('io');
    if (io) {
      io.to(`call:${callId}`).emit('call_ended', { callId, duration: updatedCall.duration });
      if (call.callerId) {
        io.to(`user:${call.callerId}`).emit('call_ended', { callId });
      }
      io.to(`user:${call.receiverId}`).emit('call_ended', { callId });
    }

    res.json({
      message: 'Chamada finalizada',
      call: updatedCall
    });
  } catch (error) {
    console.error('[CALLS] Erro ao finalizar chamada:', error);
    res.status(500).json({ error: 'Erro ao finalizar chamada' });
  }
};

/**
 * Buscar histórico de chamadas
 */
const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, type } = req.query;

    const result = await callsService.getUserCallHistory(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type
    });

    res.json(result);
  } catch (error) {
    console.error('[CALLS] Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de chamadas' });
  }
};

/**
 * Buscar chamada ativa
 */
const getActiveCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const call = await callsService.getActiveCall(userId);

    res.json({ call });
  } catch (error) {
    console.error('[CALLS] Erro ao buscar chamada ativa:', error);
    res.status(500).json({ error: 'Erro ao buscar chamada ativa' });
  }
};

/**
 * Buscar detalhes de uma chamada
 */
const getCallDetails = async (req, res) => {
  try {
    const { callId } = req.params;
    const call = await callsService.getCallById(callId);

    if (!call) {
      return res.status(404).json({ error: 'Chamada não encontrada' });
    }

    res.json({ call });
  } catch (error) {
    console.error('[CALLS] Erro ao buscar chamada:', error);
    res.status(500).json({ error: 'Erro ao buscar chamada' });
  }
};

/**
 * Buscar moradores de uma unidade (para visitantes)
 */
const getUnitResidents = async (req, res) => {
  try {
    const { unitId } = req.params;
    const residents = await callsService.getUnitResidents(unitId);

    res.json({ residents });
  } catch (error) {
    console.error('[CALLS] Erro ao buscar moradores:', error);
    res.status(500).json({ error: 'Erro ao buscar moradores' });
  }
};

/**
 * Buscar unidade/condomínio por QR Code (para visitantes)
 */
const getByQRCode = async (req, res) => {
  try {
    const { code } = req.params;
    const result = await callsService.getUnitByQRCode(code);

    if (!result) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }

    res.json(result);
  } catch (error) {
    console.error('[CALLS] Erro ao buscar por QR Code:', error);
    res.status(500).json({ error: 'Erro ao buscar por QR Code' });
  }
};

module.exports = {
  initiateCall,
  answerCall,
  rejectCall,
  endCall,
  getCallHistory,
  getActiveCall,
  getCallDetails,
  getUnitResidents,
  getByQRCode
};
