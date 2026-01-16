const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Gerar tokens de acesso e refresh
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = uuidv4();

  return { accessToken, refreshToken };
};

/**
 * Registrar novo usuário
 */
const register = async ({ email, password, name, phone }) => {
  // Verificar se email já existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('Email já cadastrado');
    error.statusCode = 409;
    throw error;
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'RESIDENT',
      status: 'PENDING' // Aguardando aprovação do admin
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true
    }
  });

  // Gerar tokens
  const tokens = generateTokens(user.id);

  // Salvar refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt
    }
  });

  return { user, tokens };
};

/**
 * Login de usuário
 */
const login = async (email, password) => {
  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      condominium: true,
      unit: {
        include: {
          block: true
        }
      }
    }
  });

  if (!user) {
    const error = new Error('Email ou senha inválidos');
    error.statusCode = 401;
    throw error;
  }

  // Verificar senha
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    const error = new Error('Email ou senha inválidos');
    error.statusCode = 401;
    throw error;
  }

  // Verificar status
  if (user.status === 'INACTIVE') {
    const error = new Error('Usuário inativo');
    error.statusCode = 403;
    throw error;
  }

  // Gerar tokens
  const tokens = generateTokens(user.id);

  // Salvar refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt
    }
  });

  // Remover senha do retorno
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
};

/**
 * Renovar token de acesso
 */
const refreshToken = async (token) => {
  // Buscar refresh token
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!storedToken) {
    const error = new Error('Refresh token inválido');
    error.statusCode = 401;
    throw error;
  }

  // Verificar expiração
  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const error = new Error('Refresh token expirado');
    error.statusCode = 401;
    throw error;
  }

  // Gerar novos tokens
  const tokens = generateTokens(storedToken.userId);

  // Atualizar refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: {
      token: tokens.refreshToken,
      expiresAt
    }
  });

  return tokens;
};

/**
 * Obter usuário por ID
 */
const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
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
          block: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  if (!user) {
    const error = new Error('Usuário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Logout - remover refresh token
 */
const logout = async (userId, refreshTokenValue) => {
  if (refreshTokenValue) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshTokenValue
      }
    });
  }
};

/**
 * Atualizar senha
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error('Usuário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    const error = new Error('Senha atual incorreta');
    error.statusCode = 401;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  // Invalidar todos os refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

/**
 * Solicitar recuperação de senha
 */
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Não revelar se o email existe ou não
    return;
  }

  // TODO: Implementar envio de email com token de recuperação
  // Por enquanto, apenas logamos
  console.log(`[FORGOT PASSWORD] Token de recuperação para ${email}`);
};

/**
 * Resetar senha com token
 */
const resetPassword = async (token, newPassword) => {
  // TODO: Implementar validação do token de recuperação
  const error = new Error('Funcionalidade em desenvolvimento');
  error.statusCode = 501;
  throw error;
};

/**
 * Atualizar token de push notification
 */
const updatePushToken = async (userId, pushToken) => {
  await prisma.user.update({
    where: { id: userId },
    data: { pushToken }
  });
};

/**
 * Seed admin - criar ou atualizar usuário admin inicial
 * Endpoint protegido por chave secreta
 */
const seedAdmin = async (email, password, name, secretKey) => {
  // Verificar chave secreta
  const validKey = process.env.ADMIN_SEED_KEY || 'interfoneapp-admin-seed-2026';
  if (secretKey !== validKey) {
    const error = new Error('Chave secreta inválida');
    error.statusCode = 403;
    throw error;
  }

  // Verificar se usuário existe
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    // Atualizar para admin e ativo
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        name,
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });
    return { user, action: 'updated' };
  } else {
    // Criar novo admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });
    return { user, action: 'created' };
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getUserById,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
  updatePushToken,
  seedAdmin
};
