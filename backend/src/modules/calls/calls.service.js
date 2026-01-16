const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Criar uma nova chamada
 */
const createCall = async (data) => {
  const { callerId, receiverId, callerName, callerType, type } = data;

  const call = await prisma.call.create({
    data: {
      callerId,
      receiverId,
      callerName,
      callerType: callerType || 'user',
      type: type || 'VIDEO',
      status: 'RINGING',
      startedAt: new Date()
    },
    include: {
      caller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true
        }
      },
      receiver: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          pushToken: true,
          unit: {
            select: {
              id: true,
              number: true,
              block: {
                select: {
                  id: true,
                  name: true,
                  condominium: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return call;
};

/**
 * Atender uma chamada
 */
const answerCall = async (callId) => {
  const call = await prisma.call.update({
    where: { id: callId },
    data: {
      status: 'ANSWERED',
      answeredAt: new Date()
    }
  });

  return call;
};

/**
 * Rejeitar uma chamada
 */
const rejectCall = async (callId) => {
  const call = await prisma.call.update({
    where: { id: callId },
    data: {
      status: 'REJECTED',
      endedAt: new Date()
    }
  });

  return call;
};

/**
 * Finalizar uma chamada
 */
const endCall = async (callId) => {
  const call = await prisma.call.findUnique({
    where: { id: callId }
  });

  if (!call) {
    throw new Error('Chamada não encontrada');
  }

  const endedAt = new Date();
  let duration = null;

  // Calcular duração se a chamada foi atendida
  if (call.answeredAt) {
    duration = Math.floor((endedAt - call.answeredAt) / 1000);
  }

  const updatedCall = await prisma.call.update({
    where: { id: callId },
    data: {
      status: call.status === 'RINGING' ? 'MISSED' : 'ENDED',
      endedAt,
      duration
    }
  });

  return updatedCall;
};

/**
 * Marcar chamada como perdida
 */
const missCall = async (callId) => {
  const call = await prisma.call.update({
    where: { id: callId },
    data: {
      status: 'MISSED',
      endedAt: new Date()
    }
  });

  return call;
};

/**
 * Buscar chamada por ID
 */
const getCallById = async (callId) => {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      caller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true
        }
      },
      receiver: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true
        }
      }
    }
  });

  return call;
};

/**
 * Buscar histórico de chamadas de um usuário
 */
const getUserCallHistory = async (userId, options = {}) => {
  const { page = 1, limit = 20, type } = options;
  const skip = (page - 1) * limit;

  const where = {
    OR: [
      { callerId: userId },
      { receiverId: userId }
    ]
  };

  if (type === 'made') {
    delete where.OR;
    where.callerId = userId;
  } else if (type === 'received') {
    delete where.OR;
    where.receiverId = userId;
  } else if (type === 'missed') {
    where.AND = [
      { receiverId: userId },
      { status: 'MISSED' }
    ];
    delete where.OR;
  }

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        caller: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.call.count({ where })
  ]);

  return {
    calls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Buscar chamadas ativas de um usuário
 */
const getActiveCall = async (userId) => {
  const call = await prisma.call.findFirst({
    where: {
      OR: [
        { callerId: userId },
        { receiverId: userId }
      ],
      status: {
        in: ['RINGING', 'ANSWERED']
      }
    },
    include: {
      caller: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      receiver: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return call;
};

/**
 * Buscar moradores de uma unidade para chamada
 */
const getUnitResidents = async (unitId) => {
  const residents = await prisma.user.findMany({
    where: {
      unitId,
      status: 'ACTIVE',
      role: 'RESIDENT'
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      phone: true,
      pushToken: true
    }
  });

  return residents;
};

/**
 * Buscar unidade por QR Code
 */
const getUnitByQRCode = async (qrCode) => {
  // Tentar encontrar unidade pelo QR Code
  let unit = await prisma.unit.findUnique({
    where: { qrCode },
    include: {
      block: {
        include: {
          condominium: true
        }
      },
      residents: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  // Se não encontrar, tentar encontrar condomínio pelo QR Code
  if (!unit) {
    const condominium = await prisma.condominium.findUnique({
      where: { qrCode },
      include: {
        blocks: {
          include: {
            units: {
              include: {
                residents: {
                  where: { status: 'ACTIVE' },
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (condominium) {
      return { type: 'condominium', data: condominium };
    }
  }

  if (unit) {
    return { type: 'unit', data: unit };
  }

  return null;
};

module.exports = {
  createCall,
  answerCall,
  rejectCall,
  endCall,
  missCall,
  getCallById,
  getUserCallHistory,
  getActiveCall,
  getUnitResidents,
  getUnitByQRCode
};
