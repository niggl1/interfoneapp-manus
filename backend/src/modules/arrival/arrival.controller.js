const arrivalService = require('./arrival.service');

// ==================== PIN ====================

exports.setPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const result = await arrivalService.setPin(req.user.id, pin);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const result = await arrivalService.verifyPin(req.user.id, pin);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.checkPin = async (req, res, next) => {
  try {
    const result = await arrivalService.checkPin(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== VEÍCULOS ====================

exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await arrivalService.getVehicles(req.user.id);
    res.json({ vehicles });
  } catch (error) {
    next(error);
  }
};

exports.addVehicle = async (req, res, next) => {
  try {
    const { plate, model, color, isDefault } = req.body;
    const vehicle = await arrivalService.addVehicle(req.user.id, { plate, model, color, isDefault });
    res.status(201).json({ vehicle });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plate, model, color } = req.body;
    const vehicle = await arrivalService.updateVehicle(req.user.id, id, { plate, model, color });
    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    await arrivalService.deleteVehicle(req.user.id, id);
    res.json({ message: 'Veículo removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

exports.setDefaultVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await arrivalService.setDefaultVehicle(req.user.id, id);
    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
};

// ==================== AVISOS DE CHEGADA ====================

exports.sendArrivalNotice = async (req, res, next) => {
  try {
    const { 
      vehicleId, 
      transportType,
      rideVehiclePlate,
      rideVehicleModel,
      rideVehicleColor,
      rideDriverName,
      latitude, 
      longitude 
    } = req.body;
    
    const notice = await arrivalService.sendArrivalNotice(req.user.id, {
      vehicleId,
      transportType,
      rideVehiclePlate,
      rideVehicleModel,
      rideVehicleColor,
      rideDriverName,
      latitude,
      longitude
    });
    
    res.status(201).json({ notice });
  } catch (error) {
    next(error);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const notice = await arrivalService.updateLocation(req.user.id, id, latitude, longitude);
    res.json({ notice });
  } catch (error) {
    next(error);
  }
};

exports.cancelArrival = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await arrivalService.cancelArrival(req.user.id, id);
    res.json({ notice });
  } catch (error) {
    next(error);
  }
};

exports.getArrivalHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const history = await arrivalService.getArrivalHistory(req.user.id, parseInt(page), parseInt(limit));
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// ==================== ROTAS DO PORTEIRO ====================

exports.getPendingArrivals = async (req, res, next) => {
  try {
    const arrivals = await arrivalService.getPendingArrivals(req.user.condominiumId);
    res.json({ arrivals });
  } catch (error) {
    next(error);
  }
};

exports.confirmArrival = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await arrivalService.confirmArrival(id, req.user.id);
    res.json({ notice });
  } catch (error) {
    next(error);
  }
};

exports.markAsArrived = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await arrivalService.markAsArrived(id);
    res.json({ notice });
  } catch (error) {
    next(error);
  }
};
