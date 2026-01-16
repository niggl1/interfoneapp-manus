const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ==================== FUNÇÕES PÚBLICAS ====================

/**
 * Buscar por QR Code
 */
const getByQRCode = async (code) => {
  // Primeiro tenta encontrar uma unidade
  const unit = await prisma.unit.findUnique({
    where: { qrCode: code },
    include: {
      block: {
        include: {
          condominium: {
            select: { id: true, name: true }
          }
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

  if (unit) {
    return {
      type: 'unit',
      unit: {
        id: unit.id,
        number: unit.number,
        floor: unit.floor,
        block: unit.block,
        residents: unit.residents
      },
      condominium: unit.block.condominium
    };
  }

  // Se não encontrou unidade, tenta encontrar condomínio
  const condominium = await prisma.condominium.findUnique({
    where: { qrCode: code },
    select: {
      id: true,
      name: true,
      address: true
    }
  });

  if (condominium) {
    return {
      type: 'condominium',
      condominium
    };
  }

  const error = new Error('QR Code não encontrado');
  error.statusCode = 404;
  throw error;
};

/**
 * Buscar moradores de uma unidade (público)
 */
const getUnitResidentsPublic = async (unitId) => {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
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
  });

  if (!unit) {
    const error = new Error('Unidade não encontrada');
    error.statusCode = 404;
    throw error;
  }

  return unit.residents;
};

/**
 * Buscar unidades/moradores (público)
 */
const searchUnitsPublic = async (condominiumId, query) => {
  const results = [];

  // Buscar por número de apartamento
  const units = await prisma.unit.findMany({
    where: {
      block: { condominiumId },
      number: { contains: query || '', mode: 'insensitive' }
    },
    include: {
      block: {
        select: { id: true, name: true }
      },
      residents: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    },
    take: 20
  });

  units.forEach(unit => {
    results.push({
      type: 'unit',
      id: unit.id,
      label: `${unit.block.name} - ${unit.number}`,
      block: unit.block,
      number: unit.number,
      residents: unit.residents
    });
  });

  // Buscar por nome de morador
  if (query) {
    const residents = await prisma.user.findMany({
      where: {
        condominiumId,
        status: 'ACTIVE',
        role: { in: ['RESIDENT', 'JANITOR'] },
        name: { contains: query, mode: 'insensitive' }
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
      take: 20
    });

    residents.forEach(resident => {
      // Evitar duplicatas
      const exists = results.some(r => 
        r.type === 'resident' && r.id === resident.id
      );

      if (!exists) {
        results.push({
          type: 'resident',
          id: resident.id,
          name: resident.name,
          avatar: resident.avatar,
          role: resident.role,
          unit: resident.unit
        });
      }
    });
  }

  return results;
};

// ==================== CONDOMÍNIOS ====================

/**
 * Listar condomínios
 */
const getCondominiums = async (user) => {
  const where = {};

  // Se não for admin global, mostra apenas o condomínio do usuário
  if (user.role !== 'ADMIN' && user.condominiumId) {
    where.id = user.condominiumId;
  }

  const condominiums = await prisma.condominium.findMany({
    where,
    include: {
      _count: {
        select: {
          blocks: true,
          users: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return condominiums;
};

/**
 * Obter condomínio por ID
 */
const getCondominiumById = async (id) => {
  const condominium = await prisma.condominium.findUnique({
    where: { id },
    include: {
      blocks: {
        include: {
          _count: {
            select: { units: true }
          }
        },
        orderBy: { name: 'asc' }
      },
      _count: {
        select: {
          users: true
        }
      }
    }
  });

  if (!condominium) {
    const error = new Error('Condomínio não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return condominium;
};

/**
 * Criar condomínio
 */
const createCondominium = async (data) => {
  const condominium = await prisma.condominium.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      email: data.email,
      qrCode: `COND-${uuidv4().substring(0, 8).toUpperCase()}`
    }
  });

  return condominium;
};

/**
 * Atualizar condomínio
 */
const updateCondominium = async (id, data) => {
  const condominium = await prisma.condominium.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      email: data.email
    }
  });

  return condominium;
};

/**
 * Deletar condomínio
 */
const deleteCondominium = async (id) => {
  await prisma.condominium.delete({ where: { id } });
};

// ==================== BLOCOS ====================

/**
 * Listar blocos
 */
const getBlocks = async (condominiumId) => {
  if (!condominiumId) {
    return [];
  }

  const blocks = await prisma.block.findMany({
    where: { condominiumId },
    include: {
      _count: {
        select: { units: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return blocks;
};

/**
 * Obter bloco por ID
 */
const getBlockById = async (id) => {
  const block = await prisma.block.findUnique({
    where: { id },
    include: {
      condominium: {
        select: { id: true, name: true }
      },
      units: {
        include: {
          _count: {
            select: { residents: true }
          }
        },
        orderBy: { number: 'asc' }
      }
    }
  });

  if (!block) {
    const error = new Error('Bloco não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return block;
};

/**
 * Criar bloco
 */
const createBlock = async (data) => {
  const block = await prisma.block.create({
    data: {
      name: data.name,
      condominiumId: data.condominiumId
    }
  });

  return block;
};

/**
 * Atualizar bloco
 */
const updateBlock = async (id, data) => {
  const block = await prisma.block.update({
    where: { id },
    data: { name: data.name }
  });

  return block;
};

/**
 * Deletar bloco
 */
const deleteBlock = async (id) => {
  await prisma.block.delete({ where: { id } });
};

// ==================== UNIDADES ====================

/**
 * Listar unidades
 */
const getUnits = async (blockId, condominiumId) => {
  const where = {};

  if (blockId) {
    where.blockId = blockId;
  } else if (condominiumId) {
    where.block = { condominiumId };
  }

  const units = await prisma.unit.findMany({
    where,
    include: {
      block: {
        select: { id: true, name: true }
      },
      _count: {
        select: { residents: true }
      }
    },
    orderBy: [
      { block: { name: 'asc' } },
      { number: 'asc' }
    ]
  });

  return units;
};

/**
 * Obter unidade por ID
 */
const getUnitById = async (id) => {
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      block: {
        include: {
          condominium: {
            select: { id: true, name: true }
          }
        }
      },
      residents: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          status: true
        }
      }
    }
  });

  if (!unit) {
    const error = new Error('Unidade não encontrada');
    error.statusCode = 404;
    throw error;
  }

  return unit;
};

/**
 * Obter moradores de uma unidade
 */
const getUnitResidents = async (unitId) => {
  const residents = await prisma.user.findMany({
    where: { unitId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      status: true
    }
  });

  return residents;
};

/**
 * Criar unidade
 */
const createUnit = async (data) => {
  const unit = await prisma.unit.create({
    data: {
      number: data.number,
      floor: data.floor,
      blockId: data.blockId,
      qrCode: `UNIT-${uuidv4().substring(0, 8).toUpperCase()}`
    },
    include: {
      block: {
        select: { id: true, name: true }
      }
    }
  });

  return unit;
};

/**
 * Atualizar unidade
 */
const updateUnit = async (id, data) => {
  const unit = await prisma.unit.update({
    where: { id },
    data: {
      number: data.number,
      floor: data.floor
    }
  });

  return unit;
};

/**
 * Deletar unidade
 */
const deleteUnit = async (id) => {
  await prisma.unit.delete({ where: { id } });
};

// ==================== QR CODES ====================

/**
 * Gerar novo QR Code para unidade
 */
const generateUnitQRCode = async (unitId) => {
  const qrCode = `UNIT-${uuidv4().substring(0, 8).toUpperCase()}`;

  const unit = await prisma.unit.update({
    where: { id: unitId },
    data: { qrCode }
  });

  return { qrCode: unit.qrCode };
};

/**
 * Gerar novo QR Code para condomínio
 */
const generateCondominiumQRCode = async (condominiumId) => {
  const qrCode = `COND-${uuidv4().substring(0, 8).toUpperCase()}`;

  const condominium = await prisma.condominium.update({
    where: { id: condominiumId },
    data: { qrCode }
  });

  return { qrCode: condominium.qrCode };
};

module.exports = {
  getByQRCode,
  getUnitResidentsPublic,
  searchUnitsPublic,
  getCondominiums,
  getCondominiumById,
  createCondominium,
  updateCondominium,
  deleteCondominium,
  getBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
  getUnits,
  getUnitById,
  getUnitResidents,
  createUnit,
  updateUnit,
  deleteUnit,
  generateUnitQRCode,
  generateCondominiumQRCode
};
