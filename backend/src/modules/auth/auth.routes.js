const express = require('express');
const { body } = require('express-validator');
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

// Validações
const registerValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('phone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Rotas públicas
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);
router.post('/seed-admin', authController.seedAdmin);

// Rota de ativação de usuário de teste (apenas desenvolvimento)
router.post('/activate-test-user', authController.activateTestUser);

// Rotas autenticadas
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.put('/update-password', authenticate, authController.updatePassword);
router.put('/update-push-token', authenticate, authController.updatePushToken);

module.exports = router;
