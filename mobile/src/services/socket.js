import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = 'http://192.168.1.100:3000'; // Alterar para o IP do servidor

let socket = null;

export const connectSocket = async () => {
  if (socket?.connected) {
    return socket;
  }

  try {
    const token = await SecureStore.getItemAsync('accessToken');
    
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('🔌 Socket conectado:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Erro de conexão:', error.message);
    });

    return socket;
  } catch (error) {
    console.error('Erro ao conectar socket:', error);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default {
  connectSocket,
  disconnectSocket,
  getSocket
};
