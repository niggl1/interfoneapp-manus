const express = require('express');
const { body, param, query } = require('express-validator');
const invitationsController = require('./invitations.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

// Validações
const createInvitationValidation = [
  body('visitorName').notEmpty().withMessage('Nome do visitante é obrigatório'),
  body('visitorPhone').optional().isString(),
  body('visitorEmail').optional().isEmail().withMessage('Email inválido'),
  body('validUntil').notEmpty().isISO8601().withMessage('Data de validade inválida'),
  body('maxUses').optional().isInt({ min: 1, max: 100 }).withMessage('Número de usos deve ser entre 1 e 100'),
  body('notes').optional().isString().isLength({ max: 500 })
];

const useInvitationValidation = [
  body('visitorName').optional().isString(),
  body('visitorPhone').optional().isString()
];

// ==================== ROTAS PÚBLICAS ====================

// Buscar convite por código (para visitantes)
router.get('/code/:code', invitationsController.getInvitationByCode);

// Usar/validar convite (quando visitante chega)
router.post('/code/:code/use', useInvitationValidation, invitationsController.useInvitation);

// ==================== ROTAS AUTENTICADAS ====================

router.use(authenticate);

// Criar novo convite
router.post('/', createInvitationValidation, invitationsController.createInvitation);

// Listar meus convites
router.get('/my', invitationsController.getMyInvitations);

// Buscar convite por ID
router.get('/:id', invitationsController.getInvitationById);

// Cancelar convite
router.delete('/:id', invitationsController.cancelInvitation);

// Listar convites do condomínio (para portaria)
router.get('/condominium/active', invitationsController.getCondominiumInvitations);

module.exports = router;
