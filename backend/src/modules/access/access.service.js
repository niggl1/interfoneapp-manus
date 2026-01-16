const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== VEÍCULOS ====================

/**
 * Listar veículos do usuário
 */
const getUserVehicles = async (userId) => {
  return prisma.vehicle.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' }
  });
};

/**
 * Criar veículo
 */
const createVehicle = async (data) => {
  const { userId, plate, model, color, isDefault } = data;

  // Se for o primeiro veículo ou marcado como padrão, desmarcar outros
  if (isDefault) {
    await prisma.vehicle.updateMany({
      where: { userId },
      data: { isDefault: false }
    });
  }

  // Verificar se é o primeiro veículo
  const existingVehicles = await prisma.vehicle.count({ where: { userId } });
  
  return prisma.vehicle.create({
    data: {
      userId,
      plate: plate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      model,
      color,
      isDefault: isDefault || existingVehicles === 0
    }
  });
};

/**
 * Atualizar veículo
 */
const updateVehicle = async (id, userId, data) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId }
  });

  if (!vehicle) {
    throw new Error('Veículo não encontrado');
  }

  if (data.isDefault) {
    await prisma.vehicle.updateMany({
      where: { userId, id: { not: id } },
      data: { isDefault: false }
    });
  }

  return prisma.vehicle.update({
    where: { id },
    data: {
      plate: data.plate ? data.plate.toUpperCase().replace(/[^A-Z0-9]/g, '') : undefined,
      model: data.model,
      color: data.color,
      isDefault: data.isDefault
    }
  });
};

/**
 * Deletar veículo
 */
const deleteVehicle = async (id, userId) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId }
  });

  if (!vehicle) {
    throw new Error('Veículo não encontrado');
  }

  await prisma.vehicle.delete({ where: { id } });

  // Se era o padrão, definir outro como padrão
  if (vehicle.isDefault) {
    const firstVehicle = await prisma.vehicle.findFirst({
      where: { userId }
    });
    if (firstVehicle) {
      await prisma.vehicle.update({
        where: { id: firstVehicle.id },
        data: { isDefault: true }
      });
    }
  }

  return { success: true };
};

// ==================== PIN DE SEGURANÇA ====================

/**
 * Definir PIN do usuário
 */
const setUserPin = async (userId, pin) => {
  // Validar PIN (4-6 dígitos)
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN deve ter entre 4 e 6 dígitos');
  }

  // Usar bcrypt para criptografar o PIN
  const bcrypt = require('bcryptjs');
  const hashedPin = await bcrypt.hash(pin, 10);

  return prisma.userPin.upsert({
    where: { userId },
    update: { pin: hashedPin },
    create: { userId, pin: hashedPin }
  });
};

/**
 * Verificar PIN do usuário
 */
const verifyUserPin = async (userId, pin) => {
  const userPin = await prisma.userPin.findUnique({
    where: { userId }
  });

  if (!userPin) {
    throw new Error('PIN não configurado');
  }

  const bcrypt = require('bcryptjs');
  const isValid = await bcrypt.compare(pin, userPin.pin);

  if (!isValid) {
    throw new Error('PIN incorreto');
  }

  return { valid: true };
};

/**
 * Verificar se usuário tem PIN
 */
const hasUserPin = async (userId) => {
  const userPin = await prisma.userPin.findUnique({
    where: { userId }
  });
  return { hasPin: !!userPin };
};

// ==================== AVISOS DE CHEGADA ====================

/**
 * Criar aviso de chegada
 */
const createArrivalNotice = async (data, io) => {
  const { userId, vehicleId, condominiumId, transportType, rideData } = data;

  // Verificar se já existe um aviso ativo
  const activeNotice = await prisma.arrivalNotice.findFirst({
    where: {
      userId,
      status: { in: ['PENDING', 'CONFIRMED', 'ARRIVING_500M', 'ARRIVING_200M', 'ARRIVING_50M'] }
    }
  });

  if (activeNotice) {
    throw new Error('Já existe um aviso de chegada ativo');
  }

  const notice = await prisma.arrivalNotice.create({
    data: {
      userId,
      vehicleId: transportType === 'OWN_VEHICLE' ? vehicleId : null,
      condominiumId,
      transportType,
      rideVehiclePlate: rideData?.plate,
      rideVehicleModel: rideData?.model,
      rideVehicleColor: rideData?.color,
      rideDriverName: rideData?.driverName
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true, unitId: true }
      },
      vehicle: true
    }
  });

  // Notificar porteiros/zeladores via Socket.io
  if (io) {
    io.to(`condominium:${condominiumId}`).emit('arrival_notice', {
      type: 'new',
      notice
    });
  }

  return notice;
};

/**
 * Atualizar localização do aviso de chegada
 */
const updateArrivalLocation = async (noticeId, userId, latitude, longitude, io) => {
  const notice = await prisma.arrivalNotice.findFirst({
    where: { id: noticeId, userId }
  });

  if (!notice) {
    throw new Error('Aviso não encontrado');
  }

  // Calcular distância aproximada do condomínio (simplificado)
  // Em produção, usar API de geocoding para obter coordenadas do condomínio
  let newStatus = notice.status;
  
  // Simulação de proximidade baseada em atualizações
  // Em produção, calcular distância real
  if (notice.status === 'CONFIRMED') {
    newStatus = 'ARRIVING_500M';
  } else if (notice.status === 'ARRIVING_500M') {
    newStatus = 'ARRIVING_200M';
  } else if (notice.status === 'ARRIVING_200M') {
    newStatus = 'ARRIVING_50M';
  }

  const updated = await prisma.arrivalNotice.update({
    where: { id: noticeId },
    data: {
      latitude,
      longitude,
      lastLocationAt: new Date(),
      status: newStatus
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true }
      },
      vehicle: true
    }
  });

  // Notificar porteiros
  if (io) {
    io.to(`condominium:${notice.condominiumId}`).emit('arrival_notice', {
      type: 'location_update',
      notice: updated
    });
  }

  return updated;
};

/**
 * Confirmar recebimento do aviso (porteiro)
 */
const confirmArrivalNotice = async (noticeId, userId, io) => {
  const notice = await prisma.arrivalNotice.findUnique({
    where: { id: noticeId }
  });

  if (!notice) {
    throw new Error('Aviso não encontrado');
  }

  const updated = await prisma.arrivalNotice.update({
    where: { id: noticeId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date()
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true }
      },
      vehicle: true
    }
  });

  // Notificar morador
  if (io) {
    io.to(`user:${notice.userId}`).emit('arrival_notice', {
      type: 'confirmed',
      notice: updated
    });
  }

  return updated;
};

/**
 * Marcar chegada
 */
const markArrived = async (noticeId, userId, io) => {
  const notice = await prisma.arrivalNotice.findFirst({
    where: { id: noticeId, userId }
  });

  if (!notice) {
    throw new Error('Aviso não encontrado');
  }

  const updated = await prisma.arrivalNotice.update({
    where: { id: noticeId },
    data: {
      status: 'ARRIVED',
      arrivedAt: new Date()
    },
    include: {
      user: {
        select: { id: true, name: true }
      }
    }
  });

  // Notificar porteiros
  if (io) {
    io.to(`condominium:${notice.condominiumId}`).emit('arrival_notice', {
      type: 'arrived',
      notice: updated
    });
  }

  return updated;
};

/**
 * Cancelar aviso de chegada
 */
const cancelArrivalNotice = async (noticeId, userId, io) => {
  const notice = await prisma.arrivalNotice.findFirst({
    where: { id: noticeId, userId }
  });

  if (!notice) {
    throw new Error('Aviso não encontrado');
  }

  const updated = await prisma.arrivalNotice.update({
    where: { id: noticeId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });

  // Notificar porteiros
  if (io) {
    io.to(`condominium:${notice.condominiumId}`).emit('arrival_notice', {
      type: 'cancelled',
      noticeId
    });
  }

  return updated;
};

/**
 * Listar avisos de chegada ativos (para porteiros)
 */
const getActiveArrivalNotices = async (condominiumId) => {
  return prisma.arrivalNotice.findMany({
    where: {
      condominiumId,
      status: { in: ['PENDING', 'CONFIRMED', 'ARRIVING_500M', 'ARRIVING_200M', 'ARRIVING_50M'] }
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true, avatar: true },
        include: {
          unit: {
            include: {
              block: { select: { name: true } }
            }
          }
        }
      },
      vehicle: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Histórico de avisos de chegada do usuário
 */
const getUserArrivalHistory = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    prisma.arrivalNotice.findMany({
      where: { userId },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.arrivalNotice.count({ where: { userId } })
  ]);

  return {
    notices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// ==================== LOG DE ACESSOS ====================

/**
 * Registrar acesso
 */
const logAccess = async (data) => {
  return prisma.accessLog.create({
    data: {
      deviceId: data.deviceId,
      userId: data.userId,
      action: data.action,
      success: data.success
    }
  });
};

/**
 * Listar logs de acesso
 */
const getAccessLogs = async (condominiumId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  // Buscar dispositivos do condomínio
  const devices = await prisma.accessDevice.findMany({
    where: { condominiumId },
    select: { id: true }
  });

  const deviceIds = devices.map(d => d.id);

  const [logs, total] = await Promise.all([
    prisma.accessLog.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.accessLog.count({ where: { deviceId: { in: deviceIds } } })
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  // Veículos
  getUserVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  
  // PIN
  setUserPin,
  verifyUserPin,
  hasUserPin,
  
  // Avisos de chegada
  createArrivalNotice,
  updateArrivalLocation,
  confirmArrivalNotice,
  markArrived,
  cancelArrivalNotice,
  getActiveArrivalNotices,
  getUserArrivalHistory,
  
  // Logs
  logAccess,
  getAccessLogs
};
