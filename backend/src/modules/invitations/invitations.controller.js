const invitationsService = require('./invitations.service');
const { validationResult } = require('express-validator');

/**
 * Criar um novo convite
 */
const createInvitation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { visitorName, visitorPhone, visitorEmail, validUntil, maxUses, notes } = req.body;
    const hostId = req.user.id;
    const unitId = req.user.unitId;
    const condominiumId = req.user.condominiumId;

    if (!unitId) {
      return res.status(400).json({ error: 'Você precisa estar vinculado a uma unidade para criar convites' });
    }

    if (!condominiumId) {
      return res.status(400).json({ error: 'Você precisa estar vinculado a um condomínio para criar convites' });
    }

    const invitation = await invitationsService.createInvitation({
      hostId,
      unitId,
      condominiumId,
      visitorName,
      visitorPhone,
      visitorEmail,
      validUntil,
      maxUses,
      notes
    });

    res.status(201).json({
      message: 'Convite criado com sucesso',
      invitation
    });
  } catch (error) {
    console.error('[INVITATIONS] Erro ao criar convite:', error);
    res.status(500).json({ error: 'Erro ao criar convite' });
  }
};

/**
 * Listar convites do morador
 */
const getMyInvitations = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { page, limit, status } = req.query;

    const result = await invitationsService.getInvitationsByHost(hostId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status
    });

    res.json(result);
  } catch (error) {
    console.error('[INVITATIONS] Erro ao listar convites:', error);
    res.status(500).json({ error: 'Erro ao listar convites' });
  }
};

/**
 * Buscar convite por código (público - para visitantes)
 */
const getInvitationByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const invitation = await invitationsService.getInvitationByCode(code);

    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    // Verificar se está expirado
    const now = new Date();
    if (invitation.status === 'ACTIVE' && now > invitation.validUntil) {
      return res.status(400).json({ error: 'Este convite expirou' });
    }

    if (invitation.status !== 'ACTIVE') {
      const statusMessages = {
        USED: 'Este convite já foi utilizado',
        EXPIRED: 'Este convite expirou',
        CANCELLED: 'Este convite foi cancelado'
      };
      return res.status(400).json({ error: statusMessages[invitation.status] || 'Convite inválido' });
    }

    // Retornar dados públicos do convite
    res.json({
      valid: true,
      invitation: {
        code: invitation.code,
        visitorName: invitation.visitorName,
        validFrom: invitation.validFrom,
        validUntil: invitation.validUntil,
        host: {
          name: invitation.host.name,
          phone: invitation.host.phone,
          unit: invitation.host.unit
        }
      }
    });
  } catch (error) {
    console.error('[INVITATIONS] Erro ao buscar convite:', error);
    res.status(500).json({ error: 'Erro ao buscar convite' });
  }
};

/**
 * Usar/validar um convite (quando visitante chega)
 */
const useInvitation = async (req, res) => {
  try {
    const { code } = req.params;
    const { visitorName, visitorPhone } = req.body;

    const result = await invitationsService.useInvitation(code, {
      name: visitorName,
      phone: visitorPhone
    });

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    // Notificar o morador via Socket.io
    const io = req.app.get('io');
    if (io && result.host) {
      io.to(`user:${result.host.id}`).emit('visitor_arrived', {
        invitationCode: code,
        visitorName: visitorName || result.invitation.visitorName,
        message: `${visitorName || result.invitation.visitorName} chegou usando seu convite`
      });
    }

    res.json({
      message: 'Convite validado com sucesso',
      host: result.host
    });
  } catch (error) {
    console.error('[INVITATIONS] Erro ao usar convite:', error);
    res.status(500).json({ error: 'Erro ao validar convite' });
  }
};

/**
 * Cancelar um convite
 */
const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    const invitation = await invitationsService.cancelInvitation(id, hostId);

    res.json({
      message: 'Convite cancelado com sucesso',
      invitation
    });
  } catch (error) {
    console.error('[INVITATIONS] Erro ao cancelar convite:', error);
    res.status(400).json({ error: error.message || 'Erro ao cancelar convite' });
  }
};

/**
 * Buscar convite por ID
 */
const getInvitationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invitation = await invitationsService.getInvitationById(id);

    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    // Verificar se o usuário é o dono do convite ou admin/porteiro
    if (invitation.hostId !== userId && !['ADMIN', 'MANAGER', 'JANITOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Você não tem permissão para ver este convite' });
    }

    res.json({ invitation });
  } catch (error) {
    console.error('[INVITATIONS] Erro ao buscar convite:', error);
    res.status(500).json({ error: 'Erro ao buscar convite' });
  }
};

/**
 * Listar convites ativos do condomínio (para portaria)
 */
const getCondominiumInvitations = async (req, res) => {
  try {
    const condominiumId = req.user.condominiumId;
    const { page, limit, date } = req.query;

    if (!condominiumId) {
      return res.status(400).json({ error: 'Você não está vinculado a um condomínio' });
    }

    // Apenas admin, manager e janitor podem ver todos os convites
    if (!['ADMIN', 'MANAGER', 'JANITOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Você não tem permissão para ver os convites do condomínio' });
    }

    const result = await invitationsService.getActiveInvitationsByCondominium(condominiumId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      date
    });

    res.json(result);
  } catch (error) {
    console.error('[INVITATIONS] Erro ao listar convites do condomínio:', error);
    res.status(500).json({ error: 'Erro ao listar convites' });
  }
};

/**
 * Listar todos os convites do condomínio (admin - com filtros)
 */
const getAllCondominiumInvitations = async (req, res) => {
  try {
    const condominiumId = req.user.condominiumId;
    const { page, limit, status } = req.query;

    if (!condominiumId) {
      return res.status(400).json({ error: 'Você não está vinculado a um condomínio' });
    }

    // Apenas admin, manager e janitor podem ver todos os convites
    if (!['ADMIN', 'MANAGER', 'JANITOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Você não tem permissão para ver os convites do condomínio' });
    }

    const result = await invitationsService.getAllInvitationsByCondominium(condominiumId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status
    });

    res.json(result);
  } catch (error) {
    console.error('[INVITATIONS] Erro ao listar todos os convites:', error);
    res.status(500).json({ error: 'Erro ao listar convites' });
  }
};

/**
 * Histórico de visitantes (convites utilizados pelo morador)
 */
const getVisitorsHistory = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { filter } = req.query; // all, today, week, month

    const result = await invitationsService.getVisitorsHistory(hostId, filter);

    res.json(result);
  } catch (error) {
    console.error('[INVITATIONS] Erro ao buscar histórico de visitantes:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de visitantes' });
  }
};

module.exports = {
  createInvitation,
  getMyInvitations,
  getInvitationByCode,
  useInvitation,
  cancelInvitation,
  getInvitationById,
  getCondominiumInvitations,
  getAllCondominiumInvitations,
  getVisitorsHistory
};
