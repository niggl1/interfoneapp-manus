const express = require('express');
const { body, param, query } = require('express-validator');
const usersController = require('./users.controller');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Validações
const updateUserValidation = [
  body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('phone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido'),
  body('avatar').optional().isURL().withMessage('Avatar deve ser uma URL válida')
];

const updateStatusValidation = [
  param('id').isUUID().withMessage('ID inválido'),
  body('status').isIn(['ACTIVE', 'INACTIVE', 'PENDING']).withMessage('Status inválido')
];

const updateRoleValidation = [
  param('id').isUUID().withMessage('ID inválido'),
  body('role').isIn(['ADMIN', 'MANAGER', 'JANITOR', 'RESIDENT']).withMessage('Role inválida')
];

// Rotas para o próprio usuário
router.get('/profile', usersController.getProfile);
router.put('/profile', updateUserValidation, usersController.updateProfile);

// Rotas de push notifications
router.post('/push-token', usersController.registerPushToken);
router.delete('/push-token', usersController.removePushToken);

// Rotas para listar usuários (moradores, zelador)
router.get('/residents', usersController.getResidents);
router.get('/janitors', usersController.getJanitors);
router.get('/contacts', usersController.getContacts); // Lista de contatos para chamadas/mensagens

// Rotas administrativas (apenas ADMIN e MANAGER)
router.get('/', authorize('ADMIN', 'MANAGER'), usersController.getAllUsers);
router.get('/:id', authorize('ADMIN', 'MANAGER'), usersController.getUserById);
router.put('/:id/status', authorize('ADMIN', 'MANAGER'), updateStatusValidation, usersController.updateUserStatus);
router.put('/:id/role', authorize('ADMIN'), updateRoleValidation, usersController.updateUserRole);
router.put('/:id/unit', authorize('ADMIN', 'MANAGER'), usersController.assignUserToUnit);
router.delete('/:id', authorize('ADMIN'), usersController.deleteUser);

module.exports = router;
