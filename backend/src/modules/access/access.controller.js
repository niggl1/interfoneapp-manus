const { validationResult } = require('express-validator');
const accessService = require('./access.service');

// ==================== VEÍCULOS ====================

const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await accessService.getUserVehicles(req.user.id);
    res.json({ vehicles });
  } catch (error) {
    next(error);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const vehicle = await accessService.createVehicle({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json({ 
      message: 'Veículo cadastrado com sucesso',
      vehicle 
    });
  } catch (error) {
    next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await accessService.updateVehicle(
      req.params.id,
      req.user.id,
      req.body
    );

    res.json({ 
      message: 'Veículo atualizado com sucesso',
      vehicle 
    });
  } catch (error) {
    next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    await accessService.deleteVehicle(req.params.id, req.user.id);
    res.json({ message: 'Veículo removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

// ==================== PIN ====================

const setPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    
    if (!pin) {
      return res.status(400).json({ error: 'PIN é obrigatório' });
    }

    await accessService.setUserPin(req.user.id, pin);
    res.json({ message: 'PIN configurado com sucesso' });
  } catch (error) {
    next(error);
  }
};

const verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    
    if (!pin) {
      return res.status(400).json({ error: 'PIN é obrigatório' });
    }

    const result = await accessService.verifyUserPin(req.user.id, pin);
    res.json(result);
  } catch (error) {
    if (error.message === 'PIN incorreto' || error.message === 'PIN não configurado') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

const checkPin = async (req, res, next) => {
  try {
    const result = await accessService.hasUserPin(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== AVISOS DE CHEGADA ====================

const createArrivalNotice = async (req, res, next) => {
  try {
    const { vehicleId, transportType, rideData, pin } = req.body;

    // Verificar PIN
    if (!pin) {
      return res.status(400).json({ error: 'PIN é obrigatório para enviar aviso de chegada' });
    }

    try {
      await accessService.verifyUserPin(req.user.id, pin);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está vinculado a um condomínio' });
    }

    const io = req.app.get('io');
    const notice = await accessService.createArrivalNotice({
      userId: req.user.id,
      vehicleId,
      condominiumId: req.user.condominiumId,
      transportType: transportType || 'OWN_VEHICLE',
      rideData
    }, io);

    res.status(201).json({ 
      message: 'Aviso de chegada enviado',
      notice 
    });
  } catch (error) {
    next(error);
  }
};

const updateArrivalLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Coordenadas são obrigatórias' });
    }

    const io = req.app.get('io');
    const notice = await accessService.updateArrivalLocation(
      req.params.id,
      req.user.id,
      latitude,
      longitude,
      io
    );

    res.json({ notice });
  } catch (error) {
    next(error);
  }
};

const confirmArrivalNotice = async (req, res, next) => {
  try {
    // Verificar se é porteiro/zelador/admin
    if (!['ADMIN', 'MANAGER', 'JANITOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para confirmar avisos' });
    }

    const io = req.app.get('io');
    const notice = await accessService.confirmArrivalNotice(
      req.params.id,
      req.user.id,
      io
    );

    res.json({ 
      message: 'Aviso confirmado',
      notice 
    });
  } catch (error) {
    next(error);
  }
};

const markArrived = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const notice = await accessService.markArrived(
      req.params.id,
      req.user.id,
      io
    );

    res.json({ 
      message: 'Chegada registrada',
      notice 
    });
  } catch (error) {
    next(error);
  }
};

const cancelArrivalNotice = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const notice = await accessService.cancelArrivalNotice(
      req.params.id,
      req.user.id,
      io
    );

    res.json({ 
      message: 'Aviso cancelado',
      notice 
    });
  } catch (error) {
    next(error);
  }
};

const getActiveArrivalNotices = async (req, res, next) => {
  try {
    // Verificar se é porteiro/zelador/admin
    if (!['ADMIN', 'MANAGER', 'JANITOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para ver avisos' });
    }

    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está vinculado a um condomínio' });
    }

    const notices = await accessService.getActiveArrivalNotices(req.user.condominiumId);
    res.json({ notices });
  } catch (error) {
    next(error);
  }
};

const getArrivalHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await accessService.getUserArrivalHistory(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== LOGS ====================

const getAccessLogs = async (req, res, next) => {
  try {
    // Verificar se é admin/manager
    if (!['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para ver logs' });
    }

    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está vinculado a um condomínio' });
    }

    const { page = 1, limit = 50 } = req.query;
    const result = await accessService.getAccessLogs(
      req.user.condominiumId,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Veículos
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  
  // PIN
  setPin,
  verifyPin,
  checkPin,
  
  // Avisos de chegada
  createArrivalNotice,
  updateArrivalLocation,
  confirmArrivalNotice,
  markArrived,
  cancelArrivalNotice,
  getActiveArrivalNotices,
  getArrivalHistory,
  
  // Logs
  getAccessLogs
};
