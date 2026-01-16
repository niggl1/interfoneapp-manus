const { validationResult } = require('express-validator');
const authService = require('./auth.service');

/**
 * Registrar novo usuário
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const { email, password, name, phone } = req.body;
    const result = await authService.register({ email, password, name, phone });

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: result.user,
      tokens: result.tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login de usuário
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      message: 'Login realizado com sucesso',
      user: result.user,
      tokens: result.tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renovar token de acesso
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token é obrigatório' });
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      message: 'Token renovado com sucesso',
      tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter dados do usuário autenticado
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user.id, refreshToken);
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar senha
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
    }

    await authService.updatePassword(req.user.id, currentPassword, newPassword);

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    next(error);
  }
};

/**
 * Solicitar recuperação de senha
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    await authService.forgotPassword(email);

    res.json({ message: 'Se o email existir, você receberá instruções para recuperar a senha' });
  } catch (error) {
    next(error);
  }
};

/**
 * Resetar senha com token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    await authService.resetPassword(token, newPassword);

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar token de push notification
 */
const updatePushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ error: 'Push token é obrigatório' });
    }

    await authService.updatePushToken(req.user.id, pushToken);

    res.json({ message: 'Push token atualizado com sucesso' });
  } catch (error) {
    next(error);
  }
};

/**
 * Seed admin - criar ou atualizar usuário admin inicial
 */
const seedAdmin = async (req, res, next) => {
  try {
    const { email, password, name, secretKey } = req.body;

    if (!email || !password || !name || !secretKey) {
      return res.status(400).json({ error: 'Email, senha, nome e chave secreta são obrigatórios' });
    }

    const result = await authService.seedAdmin(email, password, name, secretKey);

    res.json({
      message: `Admin ${result.action === 'created' ? 'criado' : 'atualizado'} com sucesso`,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
  updatePushToken,
  seedAdmin
};
