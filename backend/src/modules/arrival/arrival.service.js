const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ==================== PIN ====================

exports.setPin = async (userId, pin) => {
  // Validar PIN (4-6 dígitos)
  if (!/^\d{4,6}$/.test(pin)) {
    const error = new Error('PIN deve conter 4 a 6 dígitos numéricos');
    error.statusCode = 400;
    throw error;
  }

  const hashedPin = await bcrypt.hash(pin, 10);

  const userPin = await prisma.userPin.upsert({
    where: { userId },
    update: { pin: hashedPin },
    create: { userId, pin: hashedPin }
  });

  return { message: 'PIN configurado com sucesso', hasPin: true };
};

exports.verifyPin = async (userId, pin) => {
  const userPin = await prisma.userPin.findUnique({
    where: { userId }
  });

  if (!userPin) {
    const error = new Error('PIN não configurado');
    error.statusCode = 404;
    throw error;
  }

  const isValid = await bcrypt.compare(pin, userPin.pin);

  if (!isValid) {
    const error = new Error('PIN incorreto');
    error.statusCode = 401;
    throw error;
  }

  return { valid: true };
};

exports.checkPin = async (userId) => {
  const userPin = await prisma.userPin.findUnique({
    where: { userId }
  });

  return { hasPin: !!userPin };
};

// ==================== VEÍCULOS ====================

exports.getVehicles = async (userId) => {
  return prisma.vehicle.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });
};

exports.addVehicle = async (userId, data) => {
  const { plate, model, color, isDefault } = data;

  // Se for padrão, remover padrão dos outros
  if (isDefault) {
    await prisma.vehicle.updateMany({
      where: { userId },
      data: { isDefault: false }
    });
  }

  return prisma.vehicle.create({
    data: {
      userId,
      plate: plate.toUpperCase(),
      model,
      color,
      isDefault: isDefault || false
    }
  });
};

exports.updateVehicle = async (userId, vehicleId, data) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId }
  });

  if (!vehicle) {
    const error = new Error('Veículo não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      plate: data.plate?.toUpperCase(),
      model: data.model,
      color: data.color
    }
  });
};

exports.deleteVehicle = async (userId, vehicleId) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId }
  });

  if (!vehicle) {
    const error = new Error('Veículo não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return prisma.vehicle.delete({
    where: { id: vehicleId }
  });
};

exports.setDefaultVehicle = async (userId, vehicleId) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId }
  });

  if (!vehicle) {
    const error = new Error('Veículo não encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Remover padrão dos outros
  await prisma.vehicle.updateMany({
    where: { userId },
    data: { isDefault: false }
  });

  // Definir este como padrão
  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: { isDefault: true }
  });
};

// ==================== AVISOS DE CHEGADA ====================

exports.sendArrivalNotice = async (userId, data) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      unit: {
        include: {
          block: {
            include: {
              condominium: true
            }
          }
        }
      },
      condominium: true
    }
  });

  if (!user) {
    const error = new Error('Usuário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const condominiumId = user.condominiumId || user.unit?.block?.condominiumId;

  if (!condominiumId) {
    const error = new Error('Usuário não está vinculado a um condomínio');
    error.statusCode = 400;
    throw error;
  }

  // Verificar se já existe um aviso ativo
  const existingNotice = await prisma.arrivalNotice.findFirst({
    where: {
      userId,
      status: {
        in: ['PENDING', 'CONFIRMED', 'ARRIVING_500M', 'ARRIVING_200M', 'ARRIVING_50M']
      }
    }
  });

  if (existingNotice) {
    const error = new Error('Já existe um aviso de chegada ativo');
    error.statusCode = 400;
    throw error;
  }

  const notice = await prisma.arrivalNotice.create({
    data: {
      userId,
      condominiumId,
      vehicleId: data.vehicleId,
      transportType: data.transportType || 'OWN_VEHICLE',
      rideVehiclePlate: data.rideVehiclePlate?.toUpperCase(),
      rideVehicleModel: data.rideVehicleModel,
      rideVehicleColor: data.rideVehicleColor,
      rideDriverName: data.rideDriverName,
      latitude: data.latitude,
      longitude: data.longitude,
      lastLocationAt: data.latitude ? new Date() : null
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          unit: {
            include: {
              block: true
            }
          }
        }
      },
      vehicle: true
    }
  });

  return notice;
};

exports.updateLocation = async (userId, noticeId, latitude, longitude) => {
  const notice = await prisma.arrivalNotice.findFirst({
    where: { id: noticeId, userId }
  });

  if (!notice) {
    const error = new Error('Aviso não encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Calcular distância e atualizar status se necessário
  // (A lógica de cálculo de distância seria implementada aqui)
  let newStatus = notice.status;

  // Placeholder para lógica de distância
  // Em produção, calcular distância real até o condomínio

  return prisma.arrivalNotice.update({
    where: { id: noticeId },
    data: {
      latitude,
      longitude,
      lastLocationAt: new Date(),
      status: newStatus
    }
  });
};

exports.cancelArrival = async (userId, noticeId) => {
  const notice = await prisma.arrivalNotice.findFirst({
    where: { id: noticeId, userId }
  });

  if (!notice) {
    const error = new Error('Aviso não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return prisma.arrivalNotice.update({
    where: { id: noticeId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });
};

exports.getArrivalHistory = async (userId, page, limit) => {
  const skip = (page - 1) * limit;

  const [arrivals, total] = await Promise.all([
    prisma.arrivalNotice.findMany({
      where: { userId },
      include: {
        vehicle: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.arrivalNotice.count({ where: { userId } })
  ]);

  return {
    arrivals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// ==================== ROTAS DO PORTEIRO ====================

exports.getPendingArrivals = async (condominiumId) => {
  return prisma.arrivalNotice.findMany({
    where: {
      condominiumId,
      status: {
        in: ['PENDING', 'CONFIRMED', 'ARRIVING_500M', 'ARRIVING_200M', 'ARRIVING_50M']
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
          unit: {
            include: {
              block: true
            }
          }
        }
      },
      vehicle: true
    },
    orderBy: { createdAt: 'asc' }
  });
};

exports.confirmArrival = async (noticeId, janitorId) => {
  const notice = await prisma.arrivalNotice.findUnique({
    where: { id: noticeId }
  });

  if (!notice) {
    const error = new Error('Aviso não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return prisma.arrivalNotice.update({
    where: { id: noticeId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          unit: {
            include: {
              block: true
            }
          }
        }
      },
      vehicle: true
    }
  });
};

exports.markAsArrived = async (noticeId) => {
  return prisma.arrivalNotice.update({
    where: { id: noticeId },
    data: {
      status: 'ARRIVED',
      arrivedAt: new Date()
    }
  });
};
