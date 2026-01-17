const notificationsService = require('./notifications.service');
const settingsService = require('./notification-settings.service');

/**
 * Lista notificações do usuário
 */
async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await notificationsService.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro ao listar notificações' });
  }
}

/**
 * Conta notificações não lidas
 */
async function getUnreadCount(req, res) {
  try {
    const count = await notificationsService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ error: 'Erro ao contar notificações' });
  }
}

/**
 * Marca notificação como lida
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    
    const notification = await notificationsService.markAsRead(id, req.user.id);
    res.json({ message: 'Notificação marcada como lida', notification });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    if (error.message === 'Notificação não encontrada') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
}

/**
 * Marca todas as notificações como lidas
 */
async function markAllAsRead(req, res) {
  try {
    await notificationsService.markAllAsRead(req.user.id);
    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
  }
}

/**
 * Deleta uma notificação
 */
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    
    await notificationsService.deleteNotification(id, req.user.id);
    res.json({ message: 'Notificação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    if (error.message === 'Notificação não encontrada') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao excluir notificação' });
  }
}

/**
 * Busca configurações de notificação do usuário
 */
async function getSettings(req, res) {
  try {
    const settings = await settingsService.getSettings(req.user.id);
    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações de notificação' });
  }
}

/**
 * Atualiza configurações de notificação do usuário
 */
async function updateSettings(req, res) {
  try {
    const {
      callsReceived,
      callsMissed,
      chatMessages,
      invitationsUsed,
      announcements,
      soundEnabled,
      vibrationEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    } = req.body;

    const settings = await settingsService.updateSettings(req.user.id, {
      callsReceived,
      callsMissed,
      chatMessages,
      invitationsUsed,
      announcements,
      soundEnabled,
      vibrationEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    });

    res.json({ message: 'Configurações atualizadas com sucesso', settings });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações de notificação' });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getSettings,
  updateSettings,
};
