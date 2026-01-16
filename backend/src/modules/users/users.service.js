const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Campos padrão para retorno de usuário (sem senha)
const userSelectFields = {
  id: true,
  email: true,
  name: true,
  phone: true,
  avatar: true,
  role: true,
  status: true,
  createdAt: true,
  condominium: {
    select: { id: true, name: true }
  },
  unit: {
    select: {
      id: true,
      number: true,
      floor: true,
      block: {
        select: { id: true, name: true }
      }
    }
  }
};

/**
 * Obter usuário por ID
 */
const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelectFields
  });

  if (!user) {
    const error = new Error('Usuário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Atualizar dados do usuário
 */
const updateUser = async (userId, data) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phone: data.phone,
      avatar: data.avatar
    },
    select: userSelectFields
  });

  return user;
};

/**
 * Listar moradores de um condomínio
 */
const getResidentsByCondominium = async (condominiumId) => {
  const residents = await prisma.user.findMany({
    where: {
      condominiumId,
      role: 'RESIDENT',
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      unit: {
        select: {
          id: true,
          number: true,
          block: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: [
      { unit: { block: { name: 'asc' } } },
      { unit: { number: 'asc' } },
      { name: 'asc' }
    ]
  });

  return residents;
};

/**
 * Listar zeladores de um condomínio
 */
const getJanitorsByCondominium = async (condominiumId) => {
  const janitors = await prisma.user.findMany({
    where: {
      condominiumId,
      role: 'JANITOR',
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      phone: true
    },
    orderBy: { name: 'asc' }
  });

  return janitors;
};

/**
 * Listar contatos disponíveis para chamadas/mensagens
 * Exclui o próprio usuário da lista
 */
const getContactsByCondominium = async (condominiumId, currentUserId) => {
  const contacts = await prisma.user.findMany({
    where: {
      condominiumId,
      status: 'ACTIVE',
      id: { not: currentUserId }
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      unit: {
        select: {
          id: true,
          number: true,
          block: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: [
      { role: 'asc' }, // Zeladores primeiro
      { name: 'asc' }
    ]
  });

  return contacts;
};

/**
 * Listar todos os usuários com filtros e paginação
 */
const getAllUsers = async (filters, page = 1, limit = 20) => {
  const where = {};

  if (filters.condominiumId) {
    where.condominiumId = filters.condominiumId;
  }

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelectFields,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Atualizar status do usuário
 */
const updateUserStatus = async (userId, status) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: userSelectFields
  });

  return user;
};

/**
 * Atualizar role do usuário
 */
const updateUserRole = async (userId, role) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: userSelectFields
  });

  return user;
};

/**
 * Vincular usuário a uma unidade e/ou condomínio
 */
const assignUserToUnit = async (userId, unitId, condominiumId) => {
  const updateData = {};

  if (unitId) {
    // Verificar se a unidade existe
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { block: true }
    });

    if (!unit) {
      const error = new Error('Unidade não encontrada');
      error.statusCode = 404;
      throw error;
    }

    updateData.unitId = unitId;
    // Também atualiza o condomínio baseado na unidade
    updateData.condominiumId = unit.block.condominiumId;
  }

  if (condominiumId && !unitId) {
    // Verificar se o condomínio existe
    const condominium = await prisma.condominium.findUnique({
      where: { id: condominiumId }
    });

    if (!condominium) {
      const error = new Error('Condomínio não encontrado');
      error.statusCode = 404;
      throw error;
    }

    updateData.condominiumId = condominiumId;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userSelectFields
  });

  return user;
};

/**
 * Deletar usuário
 */
const deleteUser = async (userId) => {
  await prisma.user.delete({
    where: { id: userId }
  });
};

/**
 * Registrar push token do usuário
 */
const registerPushToken = async (userId, token) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { pushToken: token },
    select: { id: true, pushToken: true }
  });

  return user;
};

/**
 * Remover push token do usuário
 */
const removePushToken = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { pushToken: null },
    select: { id: true }
  });

  return user;
};

/**
 * Obter push tokens de usuários de um condomínio
 */
const getPushTokensByCondominium = async (condominiumId, excludeUserId = null) => {
  const where = {
    condominiumId,
    status: 'ACTIVE',
    pushToken: { not: null }
  };

  if (excludeUserId) {
    where.id = { not: excludeUserId };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, pushToken: true, name: true }
  });

  return users;
};

/**
 * Obter push token de um usuário específico
 */
const getUserPushToken = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, pushToken: true, name: true }
  });

  return user;
};

module.exports = {
  getUserById,
  updateUser,
  getResidentsByCondominium,
  getJanitorsByCondominium,
  getContactsByCondominium,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  assignUserToUnit,
  deleteUser,
  registerPushToken,
  removePushToken,
  getPushTokensByCondominium,
  getUserPushToken
};
