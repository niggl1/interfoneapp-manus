require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Importar rotas
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const unitRoutes = require('./modules/units/units.routes');
const communicationRoutes = require('./modules/communication/communication.routes');
const arrivalRoutes = require('./modules/arrival/arrival.routes');

// Importar middlewares
const errorHandler = require('./middlewares/errorHandler');

// Importar Socket handlers
const setupSocketHandlers = require('./modules/communication/socket.handler');

const app = express();
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares globais
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disponibilizar io para as rotas
app.set('io', io);

// Rotas da API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/communication', communicationRoutes);
app.use('/api/v1/arrival', arrivalRoutes);

// Rota de health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path 
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Configurar handlers do Socket.io
setupSocketHandlers(io);

// Iniciar servidor
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 WebSocket disponível`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
});

module.exports = { app, server, io };
