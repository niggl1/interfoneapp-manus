const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

/**
 * Gerar código único para o convite
 */
const generateInvitationCode = () => {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `INV-${randomPart}`;
};

/**
 * Criar um novo convite
 */
const createInvitation = async (data) => {
  const { hostId, unitId, condominiumId, visitorName, visitorPhone, visitorEmail, validUntil, maxUses, notes } = data;

  // Gerar código único
  let code = generateInvitationCode();
  
  // Garantir que o código é único
  let existing = await prisma.invitation.findUnique({ where: { code } });
  while (existing) {
    code = generateInvitationCode();
    existing = await prisma.invitation.findUnique({ where: { code } });
  }

  const invitation = await prisma.invitation.create({
    data: {
      code,
      hostId,
      unitId,
      condominiumId,
      visitorName,
      visitorPhone,
      visitorEmail,
      validUntil: new Date(validUntil),
      maxUses: maxUses || 1,
      notes
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          phone: true,
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
                      name: true,
                      address: true
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

  return invitation;
};

/**
 * Listar convites de um morador
 */
const getInvitationsByHost = async (hostId, options = {}) => {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;

  const where = { hostId };
  
  if (status) {
    where.status = status;
  }

  const [invitations, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      include: {
        usages: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.invitation.count({ where })
  ]);

  return {
    invitations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Buscar convite por código
 */
const getInvitationByCode = async (code) => {
  const invitation = await prisma.invitation.findUnique({
    where: { code },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
          unit: {
            select: {
              id: true,
              number: true,
              qrCode: true,
              block: {
                select: {
                  id: true,
                  name: true,
                  condominium: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      city: true,
                      state: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      usages: true
    }
  });

  return invitation;
};

/**
 * Buscar convite por ID
 */
const getInvitationById = async (id) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          phone: true,
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
      },
      usages: true
    }
  });

  return invitation;
};

/**
 * Validar e usar um convite
 */
const useInvitation = async (code, visitorData = {}) => {
  const invitation = await getInvitationByCode(code);

  if (!invitation) {
    return { valid: false, error: 'Convite não encontrado' };
  }

  // Verificar status
  if (invitation.status !== 'ACTIVE') {
    const statusMessages = {
      USED: 'Este convite já foi utilizado',
      EXPIRED: 'Este convite expirou',
      CANCELLED: 'Este convite foi cancelado'
    };
    return { valid: false, error: statusMessages[invitation.status] || 'Convite inválido' };
  }

  // Verificar validade
  const now = new Date();
  if (now < invitation.validFrom) {
    return { valid: false, error: 'Este convite ainda não está válido' };
  }
  if (now > invitation.validUntil) {
    // Atualizar status para expirado
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' }
    });
    return { valid: false, error: 'Este convite expirou' };
  }

  // Verificar número de usos
  if (invitation.usedCount >= invitation.maxUses) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'USED' }
    });
    return { valid: false, error: 'Este convite já atingiu o limite de usos' };
  }

  // Registrar uso
  await prisma.$transaction([
    prisma.invitationUsage.create({
      data: {
        invitationId: invitation.id,
        visitorName: visitorData.name || invitation.visitorName,
        visitorPhone: visitorData.phone || invitation.visitorPhone
      }
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        usedCount: { increment: 1 },
        usedAt: now,
        status: invitation.usedCount + 1 >= invitation.maxUses ? 'USED' : 'ACTIVE'
      }
    })
  ]);

  return { 
    valid: true, 
    invitation,
    host: invitation.host
  };
};

/**
 * Cancelar um convite
 */
const cancelInvitation = async (id, hostId) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id }
  });

  if (!invitation) {
    throw new Error('Convite não encontrado');
  }

  if (invitation.hostId !== hostId) {
    throw new Error('Você não tem permissão para cancelar este convite');
  }

  if (invitation.status !== 'ACTIVE') {
    throw new Error('Este convite não pode ser cancelado');
  }

  const updated = await prisma.invitation.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });

  return updated;
};

/**
 * Listar convites ativos de um condomínio (para portaria)
 */
const getActiveInvitationsByCondominium = async (condominiumId, options = {}) => {
  const { page = 1, limit = 50, date } = options;
  const skip = (page - 1) * limit;

  const now = new Date();
  const where = {
    condominiumId,
    status: 'ACTIVE',
    validFrom: { lte: now },
    validUntil: { gte: now }
  };

  // Filtrar por data específica se fornecida
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    where.validFrom = { lte: endOfDay };
    where.validUntil = { gte: startOfDay };
  }

  const [invitations, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            phone: true,
            unit: {
              select: {
                id: true,
                number: true,
                block: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { validFrom: 'asc' },
      skip,
      take: limit
    }),
    prisma.invitation.count({ where })
  ]);

  return {
    invitations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Atualizar convites expirados
 */
const updateExpiredInvitations = async () => {
  const now = new Date();
  
  const result = await prisma.invitation.updateMany({
    where: {
      status: 'ACTIVE',
      validUntil: { lt: now }
    },
    data: {
      status: 'EXPIRED'
    }
  });

  return result.count;
};

module.exports = {
  generateInvitationCode,
  createInvitation,
  getInvitationsByHost,
  getInvitationByCode,
  getInvitationById,
  useInvitation,
  cancelInvitation,
  getActiveInvitationsByCondominium,
  updateExpiredInvitations
};
